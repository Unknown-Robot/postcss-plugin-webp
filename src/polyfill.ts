document.documentElement.classList.replace("no-js", "js");

const image = new Image();

image.onload = image.onerror = function() {
    document.documentElement.classList.add((image.height)? "webp": "no-webp");
}

image.src = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";