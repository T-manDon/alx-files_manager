# Import required libraries
import base64  # Provides encoding and decoding for base64
import requests  # Used to send HTTP requests
import sys  # Provides access to command-line arguments

# Retrieve the file path from command-line arguments (argv[1] will be the first argument)
file_path = sys.argv[1]

# Extract the file name from the file path (splitting the path by '/' and taking the last part)
file_name = file_path.split('/')[-1]

# Initialize a variable to store the base64-encoded file
file_encoded = None

# Open the image file in binary read mode ('rb')
with open(file_path, "rb") as image_file:
    # Encode the file content into base64 and decode it to a UTF-8 string
    file_encoded = base64.b64encode(image_file.read()).decode('utf-8')

# Create a dictionary to send as JSON in the POST request
# 'name' is the file name, 'type' is set to 'image', 'isPublic' is True, 
# 'data' contains the base64-encoded image, 'parentId' comes from the third command-line argument
r_json = {
    'name': file_name,  # File name
    'type': 'image',  # File type
    'isPublic': True,  # Flag indicating the file is public
    'data': file_encoded,  # Base64-encoded image data
    'parentId': sys.argv[3]  # Parent ID from the third command-line argument
}

# Set the request headers to include an authentication token (X-Token) from the second command-line argument
r_headers = { 'X-Token': sys.argv[2] }

# Send a POST request to the server with the file data and headers
r = requests.post("http://0.0.0.0:5000/files", json=r_json, headers=r_headers)

# Print the response from the server (expected to be in JSON format)
print(r.json())
