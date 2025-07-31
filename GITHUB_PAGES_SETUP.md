# GitHub Pages Setup Instructions

If you're seeing a 404 error on `https://y1jeong.github.io/`, follow these steps:

## 1. Enable GitHub Pages in Repository Settings

1. Go to your repository: `https://github.com/y1jeong/y1jeong.github.io`
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Save the settings

## 2. Trigger the GitHub Actions Workflow

The workflow should automatically run when you push to the main branch. You can also:

1. Go to the **Actions** tab in your repository
2. Find the "Deploy to GitHub Pages" workflow
3. Click **Run workflow** to manually trigger it

## 3. Wait for Deployment

- The workflow takes a few minutes to complete
- Once successful, your site will be available at `https://y1jeong.github.io/`
- Check the Actions tab for any errors if the deployment fails

## 4. Troubleshooting

- Ensure the repository name is exactly `y1jeong.github.io`
- Make sure the repository is public
- Check that the workflow file `.github/workflows/deploy.yml` exists
- Verify that the build output is in `src/frontend/dist/`

## Note

For user GitHub Pages sites (like `username.github.io`), the repository must be named exactly `username.github.io` and the content is served from the root path.