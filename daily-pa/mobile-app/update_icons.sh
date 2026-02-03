#!/bin/bash

# Define base directory (current dir)
BASE_DIR="$(pwd)"

# Define source images
ICON_SOURCE="$BASE_DIR/assets/icon.jpg"
ADAPTIVE_SOURCE="$BASE_DIR/assets/adaptive-icon.jpg"

# Define base resource path
RES_PATH="$BASE_DIR/android/app/src/main/res"

# Define sizes (density: size for standard, size for foreground)
# mdpi: 48 / 108
# hdpi: 72 / 162
# xhdpi: 96 / 216
# xxhdpi: 144 / 324
# xxxhdpi: 192 / 432

echo "Source Icon: $ICON_SOURCE"
echo "Target Path: $RES_PATH"

if [ ! -f "$ICON_SOURCE" ]; then
    echo "Error: Icon file not found at $ICON_SOURCE"
    exit 1
fi

echo "Cleaning up old .webp icons..."
find "$RES_PATH" -name "ic_launcher*.webp" -delete

# Function to generate icons
generate_icons() {
    folder=$1
    size_std=$2
    size_fg=$3
    
    target_dir="$RES_PATH/$folder"
    mkdir -p "$target_dir"
    
    # Standard Icon
    sips -z $size_std $size_std "$ICON_SOURCE" --out "$target_dir/ic_launcher.png" > /dev/null
    
    # Round Icon (copy standard for now)
    cp "$target_dir/ic_launcher.png" "$target_dir/ic_launcher_round.png"
    
    # Adaptive Foreground
    sips -z $size_fg $size_fg "$ADAPTIVE_SOURCE" --out "$target_dir/ic_launcher_foreground.png" > /dev/null
}

generate_icons "mipmap-mdpi" 48 108
generate_icons "mipmap-hdpi" 72 162
generate_icons "mipmap-xhdpi" 96 216
generate_icons "mipmap-xxhdpi" 144 324
generate_icons "mipmap-xxxhdpi" 192 432

echo "Icons updated successfully!"
