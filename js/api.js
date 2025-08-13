import { logout } from './auth.js';
import { showToast } from './ui.js';

// Endereços do Backend (n8n)
const API_BASE_URL = 'https://webhook.ia-tess.com.br/webhook';
export const N8N_LOGIN_URL = `${API_BASE_URL}/login-oreh`;
export const N8N_USER_PROFILE_URL = `${API_BASE_URL}/get-user-profile`;
export const N8N_GET_STATUS_URL = `${API_BASE_URL}/conectar-whats-teste1`;
export const N8N_GET_DRIVE_FILES_URL = `${API_BASE_URL}/coleta-arquivos-drive`;
export const N8N_UPLOAD_DRIVE_FILE_URL = `${API_BASE_URL}/upload-arquivos`; 
export const N8N_DELETE_DRIVE_FILE_URL = `${API_BASE_URL}/deleta-arquivos`;
export const N8N_GET_AGENDA_URL = `${API_BASE_URL}/get-agenda`;
export const N8N_GET_ATENDIMENTOS_URL = `${API_BASE_URL}/get-atendimentos`;
export const N8N_GET_AI_SETTINGS_URL = `${API_BASE_URL}/get-ai-settings`;
export const N8N_UPDATE_AI_SETTINGS_URL = `${API_BASE_URL}/update-ai-settings`;


// A variável global userWebhooks não é mais necessária.
// window.userWebhooks = {};

async function initializeApp() {
    console.log('[OREH] Inicializando o app...');
    // A função fetchUserConfiguration foi removida.
    // O token de login é a única verificação necessária.
    if (localStorage.getItem('oreh_token')) {
        // Clica na página home por padrão ao carregar.
        document.querySelector('.nav-link[data-page="home"]').click();
    } else {
        console.error('[OREH] Nenhuma configuração encontrada. Deslogando.');
        logout();
    }
}

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('oreh_token');
    if (!token) {
        logout();
        throw new Error("Usuário não autenticado.");
    }
    
    const defaultHeaders = {
        'Authorization': `Bearer ${token}`
    };

    // Para uploads de arquivo, o Content-Type é definido pelo FormData
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(url, config);
    if (!response.ok) {
        if(response.status === 401 || response.status === 403) {
            logout();
        }
        const errorData = await response.json().catch(() => ({ message: `Erro na requisição: ${response.statusText}` }));
        throw new Error(errorData.message || `Erro na requisição: ${response.statusText}`);
    }
    return response;
}


// ▼▼▼ NOVA FUNÇÃO PARA BUSCAR INFO DO USUÁRIO ▼▼▼
async function fetchUserProfile() {
    try {
        const response = await fetchWithAuth(N8N_USER_PROFILE_URL);
        return await response.json();
    } catch (error) {
        console.error('[OREH] Falha ao buscar perfil do usuário:', error);
        showToast(error.message, 'error');
        return null;
    }
}


export { initializeApp, fetchWithAuth, fetchUserProfile }; // Removido fetchUserConfiguration