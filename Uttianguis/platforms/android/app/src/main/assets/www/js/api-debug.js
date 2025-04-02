/**
 * Herramienta de depuración para API
 * Añade este archivo a tu proyecto y cárgalo en tu HTML
 */

(function() {
    // Crear interfaz de depuración
    function createDebugUI() {
      const debugContainer = document.createElement('div');
      debugContainer.id = 'api-debug';
      debugContainer.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 5px;
        padding: 10px;
        max-width: 300px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 12px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      `;
      
      debugContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <strong>Depuración API</strong>
          <button id="debug-close" style="background: none; border: none; cursor: pointer;">✕</button>
        </div>
        <div id="debug-status">Esperando prueba...</div>
        <div style="margin-top: 10px;">
          <button id="debug-test-api" class="debug-btn">Probar API</button>
          <button id="debug-fix-api" class="debug-btn">Corregir API</button>
        </div>
        <div id="debug-details" style="margin-top: 10px; max-height: 200px; overflow-y: auto; display: none;"></div>
      `;
      
      // Estilo para botones
      const style = document.createElement('style');
      style.textContent = `
        .debug-btn {
          background: #f1f3f5;
          border: 1px solid #ced4da;
          border-radius: 3px;
          padding: 4px 8px;
          margin-right: 5px;
          cursor: pointer;
          font-size: 12px;
        }
        .debug-btn:hover {
          background: #e9ecef;
        }
        .debug-success { color: #198754; }
        .debug-error { color: #dc3545; }
        .debug-warning { color: #ffc107; }
        .debug-info { color: #0dcaf0; }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(debugContainer);
      
      // Eventos
      document.getElementById('debug-close').addEventListener('click', () => {
        debugContainer.style.display = 'none';
      });
      
      document.getElementById('debug-test-api').addEventListener('click', testApiConnection);
      document.getElementById('debug-fix-api').addEventListener('click', fixApiIssues);
    }
    
    // Probar conexión a la API
    async function testApiConnection() {
      const statusDiv = document.getElementById('debug-status');
      const detailsDiv = document.getElementById('debug-details');
      detailsDiv.style.display = 'block';
      
      statusDiv.innerHTML = '⏳ Probando conexión...';
      detailsDiv.innerHTML = '<div>Enviando solicitud a la API...</div>';
      
      // URL de la API
      const apiUrl = "https://tianguis.somee.com/api/";
      
      try {
        // Probar con una solicitud simple
        const response = await fetch(apiUrl + 'categories', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          let data;
          try {
            data = await response.json();
            statusDiv.innerHTML = '✅ API conectada';
            detailsDiv.innerHTML = `
              <div class="debug-success">✅ Conexión exitosa</div>
              <div>URL: ${apiUrl}categories</div>
              <div>Status: ${response.status}</div>
              <div>Datos: ${JSON.stringify(data).substring(0, 100)}...</div>
            `;
          } catch (e) {
            statusDiv.innerHTML = '⚠️ API responde, pero no con JSON';
            detailsDiv.innerHTML = `
              <div class="debug-warning">⚠️ La API respondió, pero no con JSON válido</div>
              <div>URL: ${apiUrl}categories</div>
              <div>Status: ${response.status}</div>
              <div>Error: ${e.message}</div>
            `;
          }
        } else {
          statusDiv.innerHTML = '❌ Error en la API';
          detailsDiv.innerHTML = `
            <div class="debug-error">❌ Error en la respuesta</div>
            <div>URL: ${apiUrl}categories</div>
            <div>Status: ${response.status} ${response.statusText}</div>
          `;
        }
      } catch (error) {
        statusDiv.innerHTML = '❌ No se pudo conectar';
        detailsDiv.innerHTML = `
          <div class="debug-error">❌ Error de conexión</div>
          <div>URL: ${apiUrl}categories</div>
          <div>Error: ${error.message}</div>
          <div class="debug-info">Posibles causas:</div>
          <ul>
            <li>La API no está disponible</li>
            <li>Problemas de CORS</li>
            <li>Error de red</li>
          </ul>
        `;
      }
    }
    
    // Corregir problemas comunes
    function fixApiIssues() {
      const statusDiv = document.getElementById('debug-status');
      const detailsDiv = document.getElementById('debug-details');
      detailsDiv.style.display = 'block';
      
      statusDiv.innerHTML = '🔧 Aplicando correcciones...';
      detailsDiv.innerHTML = '<div>Verificando problemas comunes...</div>';
      
      let fixes = [];
      
      // 1. Verificar si window.API_BASE_URL está definido
      if (!window.API_BASE_URL) {
        window.API_BASE_URL = "https://tianguis.somee.com/api/";
        fixes.push("Definido window.API_BASE_URL");
      }
      
      // 2. Verificar si el módulo apiService está exportado correctamente
      try {
        // Intentar corregir el problema de módulos
        const script = document.createElement('script');
        script.textContent = `
          // Asegurarse de que las funciones de API estén disponibles globalmente
          window.apiService = {
            login: async function(email, password) {
              try {
                const response = await fetch("${window.API_BASE_URL || "https://tianguis.somee.com/api/"}auth/login", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ email, password })
                });
                
                if (!response.ok) {
                  throw new Error(\`Error \${response.status}: \${response.statusText}\`);
                }
                
                return await response.json();
              } catch (error) {
                console.error("Error en login:", error);
                throw error;
              }
            },
            
            getCategories: async function() {
              try {
                const response = await fetch("${window.API_BASE_URL || "https://tianguis.somee.com/api/"}categories", {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json"
                  }
                });
                
                if (!response.ok) {
                  throw new Error(\`Error \${response.status}: \${response.statusText}\`);
                }
                
                return await response.json();
              } catch (error) {
                console.error("Error al obtener categorías:", error);
                throw error;
              }
            },
            
            testConnection: async function() {
              try {
                const response = await fetch("${window.API_BASE_URL || "https://tianguis.somee.com/api/"}categories", {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json"
                  }
                });
                
                return response.ok;
              } catch (error) {
                console.error("Error al probar conexión:", error);
                return false;
              }
            }
          };
        `;
        document.head.appendChild(script);
        fixes.push("Creado objeto global window.apiService");
      } catch (e) {
        fixes.push(`Error al crear apiService global: ${e.message}`);
      }
      
      // 3. Verificar si tokenService está disponible
      try {
        const script = document.createElement('script');
        script.textContent = `
          // Asegurarse de que tokenService esté disponible globalmente
          window.tokenService = {
            getToken: function() {
              return localStorage.getItem('token');
            },
            
            setToken: function(token) {
              localStorage.setItem('token', token);
            },
            
            removeToken: function() {
              localStorage.removeItem('token');
            }
          };
        `;
        document.head.appendChild(script);
        fixes.push("Creado objeto global window.tokenService");
      } catch (e) {
        fixes.push(`Error al crear tokenService global: ${e.message}`);
      }
      
      // 4. Añadir función de prueba
      const testButton = document.createElement('button');
      testButton.textContent = 'Probar Login';
      testButton.className = 'debug-btn';
      testButton.style.marginTop = '10px';
      testButton.addEventListener('click', async () => {
        try {
          const email = prompt("Ingresa tu correo:", "");
          const password = prompt("Ingresa tu contraseña:", "");
          
          if (!email || !password) {
            alert("Debes ingresar correo y contraseña");
            return;
          }
          
          detailsDiv.innerHTML += `<div>Intentando login con ${email}...</div>`;
          
          const result = await window.apiService.login(email, password);
          
          if (result && result.token) {
            window.tokenService.setToken(result.token);
            detailsDiv.innerHTML += `<div class="debug-success">✅ Login exitoso! Token guardado.</div>`;
          } else {
            detailsDiv.innerHTML += `<div class="debug-error">❌ Login fallido: No se recibió token</div>`;
          }
        } catch (error) {
          detailsDiv.innerHTML += `<div class="debug-error">❌ Error en login: ${error.message}</div>`;
        }
      });
      document.getElementById('debug-details').appendChild(testButton);
      
      // Mostrar resultados
      if (fixes.length > 0) {
        statusDiv.innerHTML = '✅ Correcciones aplicadas';
        detailsDiv.innerHTML = '<div class="debug-success">Se aplicaron las siguientes correcciones:</div>';
        fixes.forEach(fix => {
          detailsDiv.innerHTML += `<div>- ${fix}</div>`;
        });
        detailsDiv.innerHTML += '<div class="debug-info">Ahora puedes probar la conexión nuevamente</div>';
      } else {
        statusDiv.innerHTML = '⚠️ No se encontraron problemas';
        detailsDiv.innerHTML = '<div class="debug-warning">No se identificaron problemas comunes para corregir</div>';
      }
    }
    
    // Iniciar cuando el documento esté listo
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      createDebugUI();
    } else {
      document.addEventListener('DOMContentLoaded', createDebugUI);
    }
    
    // También escuchar el evento deviceready para aplicaciones Cordova
    document.addEventListener('deviceready', function() {
      if (!document.getElementById('api-debug')) {
        createDebugUI();
      }
    }, false);
  })();