# Favicon Setup

This directory contains the favicon files for the Compound Chemistry Data app.

## Current Files

- `favicon.svg` - Primary SVG favicon (works in modern browsers)
- `site.webmanifest` - Web app manifest for PWA support
- `favicon.ico` - Placeholder (needs to be generated)

## Generating Additional Favicon Formats

To generate the missing favicon formats, you can use online tools or command-line tools:

### Option 1: Online Tools

1. Go to [favicon.io](https://favicon.io/) or [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Upload the `favicon.svg` file
3. Download the generated package
4. Replace the files in this directory

### Option 2: Command Line (if you have ImageMagick)

```bash
# Convert SVG to ICO
convert favicon.svg -resize 16x16 favicon.ico

# Convert SVG to PNG sizes
convert favicon.svg -resize 16x16 favicon-16x16.png
convert favicon.svg -resize 32x32 favicon-32x32.png
convert favicon.svg -resize 180x180 apple-touch-icon.png
convert favicon.svg -resize 192x192 android-chrome-192x192.png
convert favicon.svg -resize 512x512 android-chrome-512x512.png
```

### Option 3: Using Node.js (if you have sharp installed)

```bash
npm install -g sharp-cli
sharp -i favicon.svg -o favicon-16x16.png resize 16 16
sharp -i favicon.svg -o favicon-32x32.png resize 32 32
# ... etc
```

## Current Setup

The current setup uses the SVG favicon as the primary favicon, which works well in modern browsers. The `favicon.ico` is set as an alternate icon for older browsers.

## Testing

After adding the favicon files:

1. Clear your browser cache
2. Refresh the page
3. Check the browser tab to see the favicon
4. Test on different devices and browsers
