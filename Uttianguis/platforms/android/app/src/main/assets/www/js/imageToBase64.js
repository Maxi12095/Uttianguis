// Función para convertir archivo a base64
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!(file instanceof Blob)) {
            reject(new Error("El archivo no es válido"));
            return;
        }

        const reader = new FileReader();
        
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        
        reader.readAsDataURL(file);
    });
}

// Función para convertir múltiples archivos a base64
export async function filesToBase64(files) {
    try {
        const base64Promises = Array.from(files).map(file => fileToBase64(file));
        const base64Results = await Promise.all(base64Promises);
        return base64Results;
    } catch (error) {
        console.error('Error al convertir archivos a base64:', error);
        throw error;
    } 
}