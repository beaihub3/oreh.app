document.addEventListener('DOMContentLoaded', function () {
    console.log('[OREH] Documento carregado. Iniciando script.');

    // --- CONFIGURAÇÃO INICIAL E ESTADO GLOBAL ---
    // IMPORTANTE: PREENCHA COM AS URLS CORRETAS DOS SEUS FLUXOS N8N
    const N8N_LOGIN_URL = 'https://webhook.ia-tess.com.br/webhook/login';
    const N8N_CONFIG_URL = 'https://webhook.ia-tess.com.br/webhook/config/webhooks'; 

    let userWebhooks = {};
    console.log('[OREH] Variáveis globais inicializadas.');

    // --- LÓGICA DE AUTENTICAÇÃO E SESSÃO ---

    async function checkLoginState() {
        console.log('[OREH] Verificando estado do login...');
        const token = localStorage.getItem('oreh_token');
        if (token) {
            console.log('[OREH] Token encontrado. Exibindo app e inicializando...');
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
            await initializeApp();
        } else {
            console.log('[OREH] Nenhum token encontrado. Exibindo página de login.');
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('appContainer').style.display = 'none';
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
            console.log(`[OREH] Enviando requisição de login para: ${N8N_LOGIN_URL}`);
            const response = await fetch(N8N_LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
            });

            const responseBody = await response.json();

            if (!response.ok || !responseBody.token) {
                console.error('[OREH] Erro na resposta do login. Status:', response.status, 'Body:', responseBody);
                throw new Error(responseBody.message || 'Usuário ou senha inválidos.');
            }

            console.log('[OREH] Login bem-sucedido! Token recebido.');
            localStorage.setItem('oreh_token', responseBody.token);
            console.log('[OREH] Token salvo no localStorage. Verificando estado novamente.');
            await checkLoginState();

        } catch (error) {
            console.error('[OREH] Falha crítica no processo de login:', error);
            alert(error.message);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Entrar';
        }
    }

    function logout() {
        console.log('[OREH] Função logout() chamada.');
        localStorage.removeItem('oreh_token');
        sessionStorage.removeItem('oreh_webhooks');
        userWebhooks = {};
        console.log('[OREH] Token e webhooks removidos. Verificando estado.');
        checkLoginState();
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    async function initializeApp() {
        console.log('[OREH] Inicializando o app...');
        await fetchUserConfiguration();
        if (Object.keys(userWebhooks).length > 0) {
            console.log('[OREH] Configuração carregada. Ativando navegação e página home.');
            document.querySelector('.nav-link[data-page="home"]').click();
        } else {
            console.error('[OREH] Falha ao carregar configuração. Deslogando.');
            logout();
        }
    }

    async function fetchUserConfiguration() {
        console.log('[OREH] Buscando configuração de webhooks...');
        const cachedWebhooks = sessionStorage.getItem('oreh_webhooks');
        if (cachedWebhooks) {
            userWebhooks = JSON.parse(cachedWebhooks);
            console.log('[OREH] Webhooks carregados do cache da sessão:', userWebhooks);
            return;
        }

        const token = localStorage.getItem('oreh_token');
        if (!token) {
            console.error('[OREH] ERRO: Tentativa de buscar config sem token.');
            logout();
            return;
        }

        try {
            console.log(`[OREH] Fazendo requisição para: ${N8N_CONFIG_URL}`);
            const response = await fetch(N8N_CONFIG_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                 throw new Error('Sessão expirada. Faça login novamente.');
            }
            if (!response.ok) throw new Error('Falha ao buscar configuração do usuário.');

            const data = await response.json();
            userWebhooks = data[0];
            sessionStorage.setItem('oreh_webhooks', JSON.stringify(userWebhooks));
            console.log('[OREH] Webhooks recebidos e salvos na sessão:', userWebhooks);

        } catch (error) {
            console.error('[OREH] Falha crítica ao buscar configuração:', error);
            alert(error.message);
            logout();
        }
    }

    function getAuthHeaders(isFormData = false) {
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${localStorage.getItem('oreh_token')}`);
        if (!isFormData) {
            headers.append('Content-Type', 'application/json');
        }
        return headers;
    }

    // --- LÓGICA DE NAVEGAÇÃO ---
    function setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const pageContents = document.querySelectorAll('.page-content');
        const pageTitle = document.getElementById('pageTitle');
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetPage = this.getAttribute('data-page');
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                pageContents.forEach(page => {
                    page.id === `${targetPage}Page` ? page.classList.add('active') : page.classList.remove('active');
                });
                pageTitle.textContent = this.querySelector('span').textContent;
                
                if (targetPage === 'status') updateConnectionStatus();
                if (targetPage === 'drive') loadDriveFiles();
                if (targetPage === 'agenda') loadAgenda();
            });
        });
    }

    // --- LÓGICA DA PÁGINA STATUS ---
    // (Esta função já estava completa e correta)
    async function updateConnectionStatus() { /* ...código da função... */ }

    // --- LÓGICA DA AGENDA ---
    // (Esta função já estava completa e correta)
    async function loadAgenda() { /* ...código da função... */ }

    // --- LÓGICA DO DRIVE ---
    // (Esta função já estava completa e correta)
    async function loadDriveFiles() { /* ...código da função... */ }

    async function deleteFile(fileId, buttonElement) {
        const webhookUrl = userWebhooks.delete_drive_file_url;
        console.log(`[OREH] deleteFile() chamada. URL: ${webhookUrl}, ID do arquivo: ${fileId}`);
        if (!webhookUrl) return alert("URL para deletar arquivo não configurada.");

        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id: fileId }),
            });
            if (!response.ok) throw new Error(`Falha no webhook: ${response.statusText}`);
            
            console.log(`[OREH] Arquivo ${fileId} excluído com sucesso.`);
            buttonElement.closest('.file-card').remove();

        } catch (error) {
            console.error('[OREH] Erro ao deletar arquivo:', error);
            alert('Não foi possível excluir o arquivo.');
            buttonElement.disabled = false;
            buttonElement.innerHTML = '<i class="fas fa-trash"></i> Excluir';
        }
    }

    // --- LÓGICA DOS MODAIS (CORRIGIDA E COMPLETA) ---
    function setupUploadModal() {
        console.log('[OREH] Configurando modal de upload...');
        const uploadModal = document.getElementById('uploadModal');
        const openBtn = document.getElementById('openUploadModalBtn');
        const closeBtn = document.getElementById('closeUploadModalBtn');
        const cancelBtn = document.getElementById('cancelUploadBtn');
        const form = document.getElementById('uploadFileForm');

        if (!uploadModal || !openBtn || !closeBtn || !cancelBtn || !form) {
            console.error('[OREH] ERRO FATAL: Um ou mais elementos do modal de upload não foram encontrados no HTML.');
            return; // Impede que o script quebre
        }

        openBtn.addEventListener('click', () => {
            console.log('[OREH] Botão de abrir modal de upload clicado.');
            uploadModal.style.display = 'flex';
        });

        const closeModal = () => {
            console.log('[OREH] Fechando modal de upload.');
            uploadModal.style.display = 'none';
            form.reset();
        };
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            const webhookUrl = userWebhooks.upload_drive_file_url;
            console.log(`[OREH] Formulário de upload enviado. URL: ${webhookUrl}`);
            if (!webhookUrl) return alert('URL de upload não configurada.');

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            const formData = new FormData();
            formData.append('fileName', document.getElementById('fileNameInput').value);
            formData.append('file', document.getElementById('fileUploadInput').files[0]);

            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: getAuthHeaders(true), // Pass true for FormData
                    body: formData,
                });
                if (!response.ok) throw new Error('Falha ao enviar o arquivo.');
                
                console.log('[OREH] Arquivo enviado com sucesso.');
                closeModal();
                loadDriveFiles(); // Recarrega a lista de arquivos
            } catch (error) {
                console.error('[OREH] Erro no upload:', error);
                alert('Erro ao enviar o arquivo.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Salvar';
            }
        });
        console.log('[OREH] Modal de upload configurado com sucesso.');
    }

    function setupEventListeners() {
        console.log('[OREH] Configurando listeners de eventos globais...');
        document.getElementById('loginBtn').addEventListener('click', login);
        document.getElementById('logoutBtn').addEventListener('click', logout);
        document.getElementById('password').addEventListener('keypress', e => { if (e.key === 'Enter') login(); });
        
        // Listener para deletar arquivos (usando delegação de eventos)
        document.getElementById('fileGrid').addEventListener('click', function(event) {
            const deleteBtn = event.target.closest('.delete-file-btn');
            if (deleteBtn) {
                const fileId = deleteBtn.dataset.fileId;
                if (confirm(`Tem certeza que deseja excluir este arquivo?`)) {
                    deleteFile(fileId, deleteBtn);
                }
            }
        });
        console.log('[OREH] Listeners configurados.');
    }

    // --- INICIALIZAÇÃO ---
    setupNavigation();
    setupUploadModal(); // Agora a função existe e não vai quebrar o script
    setupEventListeners();
    checkLoginState();
});
