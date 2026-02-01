export async function compressImage(file: File, maxWidth = 1600, quality = 0.8): Promise<File> {
  // Skip if not an image
  if (!file.type.startsWith('image/')) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      let width = img.width
      let height = img.height
      
      // Calculate new dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          // Create new file with same name but likely jpg extension if converted
          const newFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(newFile)
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = (error) => {
      URL.revokeObjectURL(url)
      reject(error)
    }
    
    img.src = url
  })
}
