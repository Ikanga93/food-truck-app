# Deployment Notes

## Image Storage Solution

### Problem
Railway uses ephemeral storage - uploaded menu images are lost on every deployment because the filesystem is reset.

### Solution: Railway Volume Storage
We've configured persistent volume storage to preserve uploaded images across deployments.

#### Configuration:
1. **railway.toml**: Added volume configuration
   ```toml
   [volumes]
   uploads = "/app/uploads"
   ```

2. **Environment Variable**: `RAILWAY_VOLUME_MOUNT_PATH=/app/uploads`

3. **Server Code**: Updated multer to use volume storage path

#### Railway Setup:
1. In Railway dashboard, go to your service
2. Navigate to "Variables" tab
3. Add: `RAILWAY_VOLUME_MOUNT_PATH` = `/app/uploads`
4. Deploy the changes

### Alternative Solutions (if volume storage doesn't work):

#### Option 1: Cloud Storage (Recommended for production)
- Use AWS S3, Cloudinary, or similar
- Images stored externally, never lost
- Better performance and CDN support

#### Option 2: Database Storage
- Store images as base64 in PostgreSQL
- Not recommended for large images
- Increases database size significantly

### Current Status:
- ✅ Volume storage configured
- ✅ Environment variables set
- ✅ Server code updated
- 🔄 Requires Railway volume setup in dashboard

### Testing:
1. Deploy the changes
2. Upload a menu image
3. Deploy again (or restart service)
4. Verify image is still accessible 