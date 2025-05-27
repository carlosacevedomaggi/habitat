# About Page Debug Plan

1. Step 1: Verify the backend `/api/team/` endpoint returns the correct data; if not, fix the backend or networking.
2. Step 2: Align and validate environment variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_BASE_URL`) so the frontend can reach the API and static assets.
3. Step 3: Enable Next.js API proxy rewrites in `next.config.js` to route `/api/*` to the backend.
4. Step 4: Update the frontend’s `AboutPage` and `AdminTeamPage` components:
   - Change fetch calls to use relative `/api/team/` paths.
   - Ensure image URLs use the correct base URL.
5. Step 5: Rebuild and launch both frontend and backend (`docker-compose up --build` or local dev).
6. Step 6: Test in the browser:
   - About page should render team member cards.
   - Admin “Manage Team” page should list, create, edit, and delete team members.
7. Step 7: Verify role-based routing and permissions in `AdminLayout`.
8. Step 8: Deploy through nginx and confirm Docker/nginx proxy settings for `/api/` and `/static/`.