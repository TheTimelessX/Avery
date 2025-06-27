import requests

def upload_file(file_path):
    url = 'http://localhost:3000/upload?device_id=543dfddgdfga4gh'  # URL of the Node.js server
    with open(file_path, 'rb') as file:
        files = {'file': file}
        response = requests.post(url, files=files)
        
    if response.status_code == 200:
        print('File uploaded successfully:', response.text)
    else:
        print('Failed to upload file:', response.status_code)

# Example usage
upload_file('I:\\workspace\\Avery\\accessoryMethods.json')
