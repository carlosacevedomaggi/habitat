import os
import os.path
from flask import Flask, jsonify, send_from_directory, render_template, url_for, request, flash, redirect, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
from functools import wraps
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
import json
import sys
from sqlalchemy import func

# Get the absolute path of the current directory
basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_url_path='', static_folder='static')
# Read SECRET_KEY from environment variable, provide a default for local dev (but warn)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here-CHANGE-IN-PRODUCTION')
# Use DATABASE_URL from environment variable if available (for Heroku/Render),
# otherwise fall back to local SQLite for development.
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Ensure the URL starts with postgresql:// if Heroku provides postgres://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "habitat.db")}' # Local fallback

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Ensure upload directory exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Create uploads subdirectories
for subdir in ['properties', 'team']:
    subdir_path = os.path.join(app.config['UPLOAD_FOLDER'], subdir)
    if not os.path.exists(subdir_path):
        os.makedirs(subdir_path)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file, subfolder):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to filename to prevent duplicates
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{int(datetime.now().timestamp())}{ext}"
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], subfolder, filename)
        file.save(upload_path)
        return f'/uploads/{subfolder}/{filename}'
    return None

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor inicia sesión para acceder a esta página.'
login_manager.login_message_category = 'error'

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)
    is_editor = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    property_type = db.Column(db.String(50), nullable=False)
    bedrooms = db.Column(db.Integer)
    bathrooms = db.Column(db.Integer)
    area = db.Column(db.Float)
    image_url = db.Column(db.String(500))  # Main image
    images = db.relationship('PropertyImage', backref='property', lazy=True, cascade='all, delete-orphan')
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_featured = db.Column(db.Boolean, default=False)

class PropertyImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    order = db.Column(db.Integer)  # For ordering images

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    message = db.Column(db.Text, nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
class SiteSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    
    @staticmethod
    def get_setting(key, default=None):
        setting = SiteSettings.query.filter_by(key=key).first()
        return setting.value if setting else default

class TeamMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(500))
    order = db.Column(db.Integer)

    def __init__(self, name, position, image_url=None, order=None):
        self.name = name
        self.position = position
        self.image_url = image_url
        self.order = order if order is not None else sys.maxsize

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Acceso denegado. Se requieren privilegios de administrador.', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    featured_properties = Property.query.filter_by(is_featured=True).limit(6).all()
    return render_template('index.html', featured_properties=featured_properties)

@app.route('/properties')
def properties():
    page = request.args.get('page', 1, type=int)
    tipo = request.args.get('tipo')
    zona = request.args.get('zona')
    precio = request.args.get('precio')
    
    query = Property.query
    
    if tipo:
        query = query.filter_by(property_type=tipo)
    if zona:
        query = query.filter(Property.location.ilike(f'%{zona}%'))
    if precio:
        if precio == '0-100000':
            query = query.filter(Property.price <= 100000)
        elif precio == '100000-200000':
            query = query.filter(Property.price.between(100000, 200000))
        elif precio == '200000+':
            query = query.filter(Property.price >= 200000)
    
    pagination = query.order_by(Property.created_at.desc()).paginate(page=page, per_page=9)
    return render_template('properties.html', properties=pagination.items, pagination=pagination)

@app.route('/property/<int:id>')
def property_detail(id):
    property = Property.query.get_or_404(id)
    return render_template('property_detail.html', property=property)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        contact = Contact(
            name=request.form['name'],
            email=request.form['email'],
            phone=request.form.get('phone'),
            message=request.form['message'],
            property_id=request.form.get('property_id')
        )
        db.session.add(contact)
        db.session.commit()
        flash('¡Gracias por tu mensaje! Te contactaremos pronto.', 'success')
        return redirect(url_for('contact'))
    return render_template('contact.html')

@app.route('/admin/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin_dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('Por favor ingresa usuario y contraseña', 'error')
            return redirect(url_for('login'))
            
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            user.last_login = datetime.utcnow()
            db.session.commit()
            next_page = request.args.get('next')
            if next_page and next_page.startswith('/'):
                return redirect(next_page)
            return redirect(url_for('admin_dashboard'))
        flash('Usuario o contraseña incorrectos', 'error')
    return render_template('admin/login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/admin')
@login_required
def admin():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    if not current_user.is_admin and not current_user.is_editor:
        flash('No tienes permiso para acceder a esta página', 'error')
        return redirect(url_for('index'))
    
    properties = Property.query.order_by(Property.created_at.desc()).all()
    contacts = Contact.query.order_by(Contact.created_at.desc()).all()
    return render_template('admin/dashboard.html', 
                         properties=properties, 
                         contacts=contacts,
                         is_admin=current_user.is_admin)

@app.route('/admin/property/new', methods=['GET', 'POST'])
@login_required
def new_property():
    if not current_user.is_admin and not current_user.is_editor:
        flash('No tienes permiso para acceder a esta página', 'error')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        try:
            # Handle main image upload
            image_url = '/images/placeholder.jpg'  # Default image
            if 'main_image' in request.files:
                file = request.files['main_image']
                uploaded_path = save_uploaded_file(file, 'properties')
                if uploaded_path:
                    image_url = uploaded_path
            
            # Create new property
            property = Property(
                title=request.form['title'],
                description=request.form['description'],
                price=float(request.form['price']),
                location=request.form['location'],
                property_type=request.form['property_type'],
                bedrooms=request.form.get('bedrooms', type=int),
                bathrooms=request.form.get('bathrooms', type=int),
                area=request.form.get('area', type=float),
                image_url=image_url,
                latitude=request.form.get('latitude', type=float),
                longitude=request.form.get('longitude', type=float),
                is_featured=bool(request.form.get('is_featured'))
            )
            db.session.add(property)
            db.session.flush()  # Get property ID before committing
            
            # Handle additional images
            if 'additional_images' in request.files:
                files = request.files.getlist('additional_images')
                for i, file in enumerate(files):
                    uploaded_path = save_uploaded_file(file, 'properties')
                    if uploaded_path:
                        image = PropertyImage(
                            property_id=property.id,
                            image_url=uploaded_path,
                            order=i
                        )
                        db.session.add(image)
            
            db.session.commit()
            flash('Propiedad agregada exitosamente', 'success')
            return redirect(url_for('admin'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error al agregar la propiedad: {str(e)}', 'error')
            return redirect(url_for('new_property'))
    
    return render_template('admin/property_form.html', property=None)

@app.route('/admin/property/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_property(id):
    if not current_user.is_admin and not current_user.is_editor:
        flash('No tienes permiso para acceder a esta página', 'error')
        return redirect(url_for('index'))
    
    property = Property.query.get_or_404(id)
    
    if request.method == 'POST':
        try:
            # Handle main image upload
            if 'main_image' in request.files:
                file = request.files['main_image']
                if file.filename:
                    # Delete old main image if it exists
                    if property.image_url and property.image_url != '/images/placeholder.jpg':
                        old_image_path = os.path.join(app.root_path, 'static', property.image_url.lstrip('/'))
                        if os.path.exists(old_image_path):
                            os.remove(old_image_path)
                    
                    uploaded_path = save_uploaded_file(file, 'properties')
                    if uploaded_path:
                        property.image_url = uploaded_path
            
            # Update property details
            property.title = request.form['title']
            property.description = request.form['description']
            property.price = float(request.form['price'])
            property.location = request.form['location']
            property.property_type = request.form['property_type']
            property.bedrooms = request.form.get('bedrooms', type=int)
            property.bathrooms = request.form.get('bathrooms', type=int)
            property.area = request.form.get('area', type=float)
            property.latitude = request.form.get('latitude', type=float)
            property.longitude = request.form.get('longitude', type=float)
            property.is_featured = bool(request.form.get('is_featured'))
            
            # Handle additional images
            if 'additional_images' in request.files:
                files = request.files.getlist('additional_images')
                for i, file in enumerate(files):
                    if file.filename:
                        uploaded_path = save_uploaded_file(file, 'properties')
                        if uploaded_path:
                            image = PropertyImage(
                                property_id=property.id,
                                image_url=uploaded_path,
                                order=len(property.images) + i
                            )
                            db.session.add(image)
            
            # Handle image deletions
            images_to_keep = request.form.getlist('existing_images')
            for image in property.images:
                if str(image.id) not in images_to_keep:
                    # Delete the image file
                    image_path = os.path.join(app.root_path, 'static', image.image_url.lstrip('/'))
                    if os.path.exists(image_path):
                        os.remove(image_path)
                    db.session.delete(image)
            
            db.session.commit()
            flash('Propiedad actualizada exitosamente', 'success')
            return redirect(url_for('admin'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error al actualizar la propiedad: {str(e)}', 'error')
            return redirect(url_for('edit_property', id=id))
    
    return render_template('admin/property_form.html', property=property)

@app.route('/admin/property/<int:id>/delete', methods=['POST'])
@login_required
def delete_property(id):
    if not current_user.is_admin:
        return redirect(url_for('index'))
    property = Property.query.get_or_404(id)
    db.session.delete(property)
    db.session.commit()
    flash('Propiedad eliminada exitosamente', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/users')
@login_required
def admin_users():
    if not current_user.is_admin:
        flash('Acceso denegado. Se requieren privilegios de administrador.', 'error')
        return redirect(url_for('admin_dashboard'))
    users = User.query.all()
    return render_template('admin/users.html', users=users)

@app.route('/admin/users/new', methods=['GET', 'POST'])
@login_required
def new_user():
    if not current_user.is_admin:
        flash('Acceso denegado. Se requieren privilegios de administrador.', 'error')
        return redirect(url_for('admin_dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        is_admin = 'is_admin' in request.form
        is_editor = 'is_editor' in request.form

        if User.query.filter_by(username=username).first():
            flash('El nombre de usuario ya está en uso.', 'error')
            return redirect(url_for('new_user'))

        if User.query.filter_by(email=email).first():
            flash('El correo electrónico ya está registrado.', 'error')
            return redirect(url_for('new_user'))

        user = User(username=username, email=email, is_admin=is_admin, is_editor=is_editor)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        flash('Usuario creado exitosamente.', 'success')
        return redirect(url_for('admin_users'))

    return render_template('admin/user_form.html')

@app.route('/admin/users/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def edit_user(id):
    if not current_user.is_admin:
        flash('Acceso denegado. Se requieren privilegios de administrador.', 'error')
        return redirect(url_for('admin_dashboard'))

    user = User.query.get_or_404(id)

    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        is_admin = 'is_admin' in request.form
        is_editor = 'is_editor' in request.form

        username_exists = User.query.filter(User.username == username, User.id != id).first()
        if username_exists:
            flash('El nombre de usuario ya está en uso.', 'error')
            return redirect(url_for('edit_user', id=id))

        email_exists = User.query.filter(User.email == email, User.id != id).first()
        if email_exists:
            flash('El correo electrónico ya está registrado.', 'error')
            return redirect(url_for('edit_user', id=id))

        user.username = username
        user.email = email
        if password:
            user.set_password(password)
        user.is_admin = is_admin
        user.is_editor = is_editor
        db.session.commit()

        flash('Usuario actualizado exitosamente.', 'success')
        return redirect(url_for('admin_users'))

    return render_template('admin/user_form.html', user=user)

@app.route('/admin/users/<int:id>/delete', methods=['POST'])
@login_required
def delete_user(id):
    if not current_user.is_admin:
        flash('Acceso denegado. Se requieren privilegios de administrador.', 'error')
        return redirect(url_for('admin_dashboard'))

    user = User.query.get_or_404(id)

    if user.id == current_user.id:
        flash('No puedes eliminar tu propia cuenta.', 'error')
        return redirect(url_for('admin_users'))

    db.session.delete(user)
    db.session.commit()
    flash('Usuario eliminado exitosamente.', 'success')
    return redirect(url_for('admin_users'))

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    if not current_user.is_admin and not current_user.is_editor:
        flash('Acceso denegado. Se requieren privilegios de administrador o editor.', 'error')
        return redirect(url_for('index'))

    properties = Property.query.all()
    contacts = Contact.query.order_by(Contact.created_at.desc()).all()
    return render_template('admin/dashboard.html', properties=properties, contacts=contacts, is_admin=current_user.is_admin)

@app.route('/admin/settings', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_settings():
    if request.method == 'POST':
        try:
            for key, value in request.form.items():
                if key.startswith('setting_'):
                    setting_key = key.replace('setting_', '')
                    setting = SiteSettings.query.filter_by(key=setting_key).first()
                    if setting:
                        setting.value = value
            
            db.session.commit()
            flash('Configuración actualizada exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error al actualizar la configuración: {str(e)}', 'error')
    
    settings = SiteSettings.query.order_by(SiteSettings.category, SiteSettings.key).all()
    return render_template('admin/settings.html', settings=settings)

# Add context processor for settings
@app.context_processor
def inject_settings():
    def get_setting(key, default=None):
        setting = SiteSettings.query.filter_by(key=key).first()
        return setting.value if setting else default
    return dict(get_setting=get_setting)

@app.route('/admin/team', methods=['GET', 'POST'])
@login_required
def admin_team():
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'add':
            name = request.form.get('name')
            position = request.form.get('position')
            image = request.files.get('image')
            
            if name and position:
                image_url = None
                if image:
                    filename = secure_filename(image.filename)
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'team', filename)
                    os.makedirs(os.path.dirname(filepath), exist_ok=True)
                    image.save(filepath)
                    image_url = f'/uploads/team/{filename}'
                
                # Get max order and add 1
                max_order = db.session.query(func.max(TeamMember.order)).scalar() or 0
                
                member = TeamMember(name=name, position=position, image_url=image_url, order=max_order + 1)
                db.session.add(member)
                db.session.commit()
                flash('Miembro agregado exitosamente', 'success')
            else:
                flash('Por favor complete todos los campos requeridos', 'error')
        
        elif action == 'edit':
            member_id = request.form.get('member_id')
            name = request.form.get('name')
            position = request.form.get('position')
            image = request.files.get('image')
            
            member = TeamMember.query.get(member_id)
            if member and name and position:
                member.name = name
                member.position = position
                
                if image:
                    filename = secure_filename(image.filename)
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'team', filename)
                    os.makedirs(os.path.dirname(filepath), exist_ok=True)
                    image.save(filepath)
                    
                    # Delete old image if exists
                    if member.image_url:
                        old_filepath = os.path.join(app.root_path, 'static', member.image_url.lstrip('/'))
                        if os.path.exists(old_filepath):
                            os.remove(old_filepath)
                    
                    member.image_url = f'/uploads/team/{filename}'
                
                db.session.commit()
                flash('Miembro actualizado exitosamente', 'success')
            else:
                flash('Por favor complete todos los campos requeridos', 'error')
        
        elif action == 'delete':
            member_id = request.form.get('member_id')
            member = TeamMember.query.get(member_id)
            
            if member:
                # Delete image if exists
                if member.image_url:
                    filepath = os.path.join(app.root_path, 'static', member.image_url.lstrip('/'))
                    if os.path.exists(filepath):
                        os.remove(filepath)
                
                db.session.delete(member)
                db.session.commit()
                flash('Miembro eliminado exitosamente', 'success')
        
        elif action == 'reorder':
            order_data = json.loads(request.form.get('order_data'))
            for item in order_data:
                member = TeamMember.query.get(item['id'])
                if member:
                    member.order = item['order']
            db.session.commit()
            return jsonify({'status': 'success'})
        
        return redirect(url_for('admin_team'))
    
    team_members = TeamMember.query.order_by(TeamMember.order).all()
    return render_template('admin/team.html', team_members=team_members)

@app.route('/contact/<int:id>/pdf')
@login_required
@admin_required
def contact_pdf(id):
    contact = Contact.query.get_or_404(id)
    
    # Create PDF
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Add content
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, 750, "Mensaje de Contacto")
    
    p.setFont("Helvetica", 12)
    p.drawString(50, 700, f"Nombre: {contact.name}")
    p.drawString(50, 680, f"Email: {contact.email}")
    p.drawString(50, 660, f"Teléfono: {contact.phone or 'No proporcionado'}")
    p.drawString(50, 640, f"Fecha: {contact.created_at.strftime('%d/%m/%Y %H:%M')}")
    
    if contact.property_id:
        property = Property.query.get(contact.property_id)
        if property:
            p.drawString(50, 620, f"Propiedad: {property.title}")
    
    p.drawString(50, 580, "Mensaje:")
    
    # Wrap message text
    message_lines = []
    current_line = ""
    words = contact.message.split()
    for word in words:
        if len(current_line + " " + word) < 70:
            current_line += " " + word if current_line else word
        else:
            message_lines.append(current_line)
            current_line = word
    if current_line:
        message_lines.append(current_line)
    
    y = 560
    for line in message_lines:
        p.drawString(50, y, line)
        y -= 20
    
    p.save()
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f'contacto_{contact.id}.pdf',
        mimetype='application/pdf'
    )

@app.context_processor
def utility_processor():
    def get_team_members():
        return TeamMember.query.order_by(TeamMember.order).all()
    return dict(get_team_members=get_team_members)

@app.route('/admin/appearance', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_appearance():
    if request.method == 'POST':
        try:
            # Handle image uploads
            if 'hero_bg_image' in request.files:
                file = request.files['hero_bg_image']
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    filepath = os.path.join('uploads', 'backgrounds', filename)
                    full_path = os.path.join(app.config['UPLOAD_FOLDER'], 'backgrounds', filename)
                    os.makedirs(os.path.dirname(full_path), exist_ok=True)
                    file.save(full_path)
                    
                    # Update hero background image setting
                    setting = SiteSettings.query.filter_by(key='hero_bg_image').first()
                    if setting:
                        # Delete old background if exists
                        old_path = os.path.join(app.root_path, 'static', setting.value.lstrip('/'))
                        if os.path.exists(old_path):
                            os.remove(old_path)
                        setting.value = filepath
                    else:
                        setting = SiteSettings(key='hero_bg_image', value=filepath, category='appearance', description='Hero background image')
                        db.session.add(setting)

            # Handle image removals
            for key in request.form:
                if key.startswith('remove_') and request.form[key] == 'true':
                    setting_key = key.replace('remove_', '')
                    setting = SiteSettings.query.filter_by(key=setting_key).first()
                    if setting:
                        # Delete the file
                        file_path = os.path.join(app.root_path, 'static', setting.value.lstrip('/'))
                        if os.path.exists(file_path):
                            os.remove(file_path)
                        db.session.delete(setting)

            # Properties page colors
            properties_colors = {
                'properties_hero_bg': request.form.get('properties_hero_bg', '#1A0000'),
                'properties_hero_text': request.form.get('properties_hero_text', '#FFFFFF'),
                'properties_hero_subtitle': request.form.get('properties_hero_subtitle', '#CCCCCC'),
                
                'filter_bg': request.form.get('filter_bg', '#FFFFFF'),
                'filter_text': request.form.get('filter_text', '#333333'),
                'filter_button_bg': request.form.get('filter_button_bg', '#1A0000'),
                'filter_button_text': request.form.get('filter_button_text', '#FFFFFF'),
                
                'property_card_bg': request.form.get('property_card_bg', '#FFFFFF'),
                'property_card_text': request.form.get('property_card_text', '#333333'),
                'property_type_bg': request.form.get('property_type_bg', '#1A0000'),
                'property_type_text': request.form.get('property_type_text', '#FFFFFF'),
                'property_price_bg': request.form.get('property_price_bg', '#1A0000'),
                'property_price_text': request.form.get('property_price_text', '#FFFFFF'),
                'property_details_text': request.form.get('property_details_text', '#666666'),
                'property_details_icon': request.form.get('property_details_icon', '#D4AF37'),
                
                'map_popup_bg': request.form.get('map_popup_bg', '#FFFFFF'),
                'map_popup_text': request.form.get('map_popup_text', '#333333'),
                'map_popup_link': request.form.get('map_popup_link', '#1A0000'),
                
                'pagination_bg': request.form.get('pagination_bg', '#FFFFFF'),
                'pagination_text': request.form.get('pagination_text', '#333333'),
                'pagination_active_bg': request.form.get('pagination_active_bg', '#1A0000'),
                'pagination_active_text': request.form.get('pagination_active_text', '#FFFFFF'),
            }

            # Update settings in database
            for key, value in properties_colors.items():
                setting = SiteSettings.query.filter_by(key=key).first()
                if setting:
                    setting.value = value
                else:
                    new_setting = SiteSettings(key=key, value=value)
                    db.session.add(new_setting)

            db.session.commit()
            flash('Configuración de apariencia actualizada exitosamente', 'success')
        except Exception as e:
            db.session.rollback()
            flash('Error al actualizar la configuración de apariencia', 'error')
            print(f"Error: {str(e)}")
            
    return render_template('admin/appearance.html')

def init_db():
    with app.app_context():
        print("Attempting to create database tables...") # Add print statement
        db.create_all()
        print("Database tables check/creation complete.") # Add print statement

        # Create admin user if it doesn't exist
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@habitat.com',
                is_admin=True
            )
            admin.set_password('admin123')  # Change this password in production!
            db.session.add(admin)
            
            # Add sample properties
            sample_properties = [
                {
                    'title': 'Casa Moderna en Altamira',
                    'description': 'Hermosa casa moderna con acabados de lujo, amplios espacios y vista panorámica.',
                    'price': 350000,
                    'location': 'Altamira, Caracas',
                    'property_type': 'casa',
                    'bedrooms': 4,
                    'bathrooms': 3,
                    'area': 280,
                    'image_url': '/images/placeholder.jpg',
                    'latitude': 10.506698,
                    'longitude': -66.845307,
                    'is_featured': True
                },
                {
                    'title': 'Apartamento en La Castellana',
                    'description': 'Apartamento remodelado con excelente ubicación y todos los servicios.',
                    'price': 180000,
                    'location': 'La Castellana, Caracas',
                    'property_type': 'apartamento',
                    'bedrooms': 3,
                    'bathrooms': 2,
                    'area': 120,
                    'image_url': '/images/placeholder.jpg',
                    'latitude': 10.509193,
                    'longitude': -66.855473,
                    'is_featured': True
                },
                {
                    'title': 'Penthouse en Chacao',
                    'description': 'Espectacular penthouse con terraza y vista a la ciudad.',
                    'price': 450000,
                    'location': 'Chacao, Caracas',
                    'property_type': 'apartamento',
                    'bedrooms': 4,
                    'bathrooms': 4,
                    'area': 300,
                    'image_url': '/images/placeholder.jpg',
                    'latitude': 10.496226,
                    'longitude': -66.853555,
                    'is_featured': True
                }
            ]
            
            for prop_data in sample_properties:
                property = Property(**prop_data)
                db.session.add(property)
            
            db.session.commit()

        # Add default settings
        initialize_default_settings()

def initialize_default_settings():
    default_settings = [
        # Contact Information
        {'key': 'contact_phone', 'value': '+58 (212) 555-0123', 'category': 'contact', 'description': 'Phone number'},
        {'key': 'contact_email', 'value': 'info@habitat.com', 'category': 'contact', 'description': 'Email address'},
        {'key': 'contact_address', 'value': 'Caracas, Venezuela', 'category': 'contact', 'description': 'Office address'},
        
        # Social Media Links
        {'key': 'facebook_url', 'value': '#', 'category': 'social', 'description': 'Facebook profile URL'},
        {'key': 'instagram_url', 'value': '#', 'category': 'social', 'description': 'Instagram profile URL'},
        {'key': 'whatsapp_url', 'value': '#', 'category': 'social', 'description': 'WhatsApp contact URL'},
        
        # Why Choose Us Section
        {'key': 'why_choose_title', 'value': '¿Por Qué Elegirnos?', 'category': 'features', 'description': 'Features section title'},
        {'key': 'feature_1_title', 'value': 'Calidad Garantizada', 'category': 'features', 'description': 'First feature title'},
        {'key': 'feature_1_text', 'value': 'Todas nuestras propiedades son cuidadosamente seleccionadas y verificadas.', 'category': 'features', 'description': 'First feature description'},
        {'key': 'feature_1_icon', 'value': 'fas fa-medal', 'category': 'features', 'description': 'First feature icon'},
        {'key': 'feature_2_title', 'value': 'Servicio Personalizado', 'category': 'features', 'description': 'Second feature title'},
        {'key': 'feature_2_text', 'value': 'Te acompañamos en cada paso del proceso de búsqueda.', 'category': 'features', 'description': 'Second feature description'},
        {'key': 'feature_2_icon', 'value': 'fas fa-handshake', 'category': 'features', 'description': 'Second feature icon'},
        {'key': 'feature_3_title', 'value': 'Ubicaciones Premium', 'category': 'features', 'description': 'Third feature title'},
        {'key': 'feature_3_text', 'value': 'Las mejores zonas con excelente plusvalía.', 'category': 'features', 'description': 'Third feature description'},
        {'key': 'feature_3_icon', 'value': 'fas fa-map-marked-alt', 'category': 'features', 'description': 'Third feature icon'},
        
        # Typography
        {'key': 'primary_font', 'value': 'Poppins', 'category': 'typography', 'description': 'Primary font family'},
        {'key': 'secondary_font', 'value': 'Arial', 'category': 'typography', 'description': 'Secondary font family'},
        {'key': 'base_font_size', 'value': '16px', 'category': 'typography', 'description': 'Base font size'},
        
        # About Page
        {'key': 'about_title', 'value': 'Sobre Nosotros', 'category': 'about', 'description': 'About page title'},
        {'key': 'about_subtitle', 'value': 'Tu Socio Confiable en Bienes Raíces', 'category': 'about', 'description': 'About page subtitle'},
        {'key': 'about_description', 'value': 'Somos una empresa comprometida con brindar el mejor servicio en bienes raíces.', 'category': 'about', 'description': 'About page main description'},
        {'key': 'mission_title', 'value': 'Nuestra Misión', 'category': 'about', 'description': 'Mission section title'},
        {'key': 'mission_text', 'value': 'Nuestra misión es ayudarte a encontrar la propiedad perfecta.', 'category': 'about', 'description': 'Mission description'},
        {'key': 'vision_title', 'value': 'Nuestra Visión', 'category': 'about', 'description': 'Vision section title'},
        {'key': 'vision_text', 'value': 'Ser la empresa líder en el mercado inmobiliario.', 'category': 'about', 'description': 'Vision description'},
        
        # Contact Page
        {'key': 'contact_title', 'value': 'Contáctanos', 'category': 'contact_page', 'description': 'Contact page title'},
        {'key': 'contact_subtitle', 'value': 'Estamos aquí para ayudarte', 'category': 'contact_page', 'description': 'Contact page subtitle'},
        {'key': 'contact_description', 'value': 'Ponte en contacto con nosotros para cualquier consulta.', 'category': 'contact_page', 'description': 'Contact page description'},
        
        # Site Info
        {'key': 'site_name', 'value': 'Habitat', 'category': 'content', 'description': 'Site name'}
    ]
    
    for setting in default_settings:
        if not SiteSettings.query.filter_by(key=setting['key']).first():
            new_setting = SiteSettings(**setting)
            db.session.add(new_setting)
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error initializing settings: {e}")

if __name__ == '__main__':
    # When running locally (python server.py), initialize the DB if needed
    # On Heroku/Render, this block isn't executed by Gunicorn.
    # DB initialization should be done via a separate command (e.g., flask db init or a custom script)
    with app.app_context():
        # Check if DB exists or needs init. This is a simple check.
        # A more robust solution might use Flask-Migrate.
        inspector = db.inspect(db.engine)
        if not inspector.has_table("user"): # Check for one of your tables
             print("Database tables not found, initializing...")
             init_db() # Call the init function if tables don't exist
        else:
             print("Database tables already exist.")
    # Set debug=False when not running directly for local testing
    app.run(debug=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true')
