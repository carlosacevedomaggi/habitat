
## Features

- Property listings with map integration
- Team member management
- Contact form with PDF export
- Admin dashboard
- Dynamic content management
- Responsive design
- Image upload handling
- Dark theme

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Habitatt.git
cd Habitatt
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the root directory with:
```
FLASK_APP=server.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
```

5. Initialize the database:
```bash
python server.py
```

6. Run the development server:
```bash
flask run
```

The application will be available at `http://localhost:5000`

## Default Admin Account

- Username: admin
- Password: admin123

**Important**: Change these credentials in production!

## Directory Structure

```
Habitatt/
├── static/
│   ├── images/
│   ├── uploads/
│   ├── style.css
│   └── script.js
├── templates/
│   ├── admin/
│   ├── base.html
│   ├── index.html
│   └── ...
├── server.py
├── requirements.txt
└── README.md
```

## Deployment

### Using a VPS:

1. Set up a server with Ubuntu/Debian
2. Install required packages:
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx supervisor
```

3. Clone the repository and set up the application
4. Configure Nginx and Supervisor
5. Set up SSL with Let's Encrypt

### Using Platform as a Service:

The application is ready for deployment on platforms like:
- Heroku
- DigitalOcean App Platform
- Google Cloud Platform
- AWS Elastic Beanstalk

## Maintenance

1. Regular backups:
- Database backups
- Uploaded images backup
- Configuration backup

2. Updates:
- Keep dependencies updated
- Monitor error logs
- Update SSL certificates

3. Monitoring:
- Set up error tracking
- Monitor server resources
- Check application logs

## Security Considerations

1. Change default admin credentials
2. Use strong SECRET_KEY
3. Keep dependencies updated
4. Use HTTPS in production
5. Implement rate limiting
6. Regular security audits

## License

MIT License

## Support

For support, please open an issue in the repository or contact the development team. 
