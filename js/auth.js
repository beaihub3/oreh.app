import { showToast, updateUserInfo } from './ui.js';
import { initializeApp, fetchUserProfile } from './api.js';

const N8N_LOGIN_URL = 'https://webhook.ia-tess.com.br/webhook/login-oreh';

async function checkLoginState() {
    console.log('[OREH] Verificando estado do login...');
    const token = localStorage.getItem('oreh_token');
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');

    if (token) {
        loginPage.style.display = 'none';
        appContainer.style.display = 'block';

        const cachedName = localStorage.getItem('oreh_userName');
        const cachedInitial = localStorage.getItem('oreh_userInitial');
        if(cachedName && cachedInitial) {
            updateUserInfo(cachedName, cachedInitial);
        }

        const userProfileResponse = await fetchUserProfile();
        
        // ▼▼▼ LÓGICA CORRIGIDA AQUI ▼▼▼
        if (userProfileResponse && Array.isArray(userProfileResponse) && userProfileResponse.length > 0) {
            // 1. Pega o primeiro objeto do array
            const userProfile = userProfileResponse[0]; 

            // 2. Usa as chaves corretas da resposta ('full_name' e 'userinitial')
            const userName = userProfile.full_name;
            const userInitial = userProfile.userinitial;

            if(userName && userInitial) {
                localStorage.setItem('oreh_userName', userName);
                localStorage.setItem('oreh_userInitial', userInitial);
                updateUserInfo(userName, userInitial); // Atualiza a UI com os dados corretos
            }
        }
        
        await initializeApp();

    } else {
        loginPage.style.display = 'flex';
        appContainer.style.display = 'none';
    }
}

async function login() {
    console.log('[OREH] Função login() chamada.');
    const emailInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');

    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando...';

    try {
        const response = await fetch(N8N_LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
        });

        const responseBody = await response.json();
        
        if (!response.ok || !responseBody.token) {
            throw new Error(responseBody.message || 'Usuário ou senha inválidos.');
        }

        localStorage.setItem('oreh_token', responseBody.token);
        await checkLoginState();

    } catch (error) {
        console.error('[OREH] Falha crítica no processo de login:', error);
        showToast(error.message, 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
    }
}

function logout() {
    console.log('[OREH] Função logout() chamada.');
    localStorage.removeItem('oreh_token');
    localStorage.removeItem('oreh_userName');
    localStorage.removeItem('oreh_userInitial');
    sessionStorage.removeItem('oreh_webhooks');
    window.userWebhooks = {};
    checkLoginState();
}

export { checkLoginState, login, logout };