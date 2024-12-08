export const downloadImage = async (url, fileName) => {
    try {
        const response = await fetch(url); // Fetch the image
        if (!response.ok) throw new Error('Network response was not ok');
        alert("should download")
        const blob = await response.blob(); // Convert the response to a Blob
        const link = document.createElement('a'); // Create an anchor element
        link.href = window.URL.createObjectURL(blob); // Create a URL for the Blob
        link.download = fileName; // Set the download attribute with the desired file name
        document.body.appendChild(link); // Append the link to the body (required for Firefox)
        link.click(); // Trigger a click on the link to start the download
        document.body.removeChild(link); // Remove the link from the document
    } catch (error) {
        console.error("Error downloading image:", error);
        alert("Failed to download image.");
    }
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};