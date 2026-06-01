const PRIMARY_URL = import.meta.env.VITE_API_URL;
const LOCAL_URL = import.meta.env.VITE_LOCAL_API_URL;

let activeApiUrl = null; 

export async function getValidApiUrl() {
  if (activeApiUrl) return activeApiUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); 
    const response = await fetch(`${PRIMARY_URL}/`, { 
      method: 'GET',
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      console.log('Primary:', PRIMARY_URL);
      activeApiUrl = PRIMARY_URL;
      return activeApiUrl;
    }
  } catch (error) {
    console.warn('unreachable, switching to localhost');
  }
  
  console.log('Localhost:', LOCAL_URL);
  activeApiUrl = LOCAL_URL;
  return activeApiUrl;
}