export class Utils {
    public static validateBase64Data(data: string) {
        // Regular expression to match the data URL format: data:[<mediatype>][;base64],<data>
        const combinedPattern = /^data:([a-z]+\/[a-z-+.]+)?;base64,.+$/i;
    
        // Check if the string matches the combined pattern
        const match = data.match(combinedPattern);
    
        if (match) {
            const [, mediaType] = match;
            // Validate the media type (optional)
            if (mediaType && !/^image\/(jpeg|png|gif|bmp|svg\+xml|webp)$/.test(mediaType)) {
                return false; // Invalid media type
            }
            // Validation passed
            return true;
        } else {
            return false; // Does not match combined pattern
        }
    }
}