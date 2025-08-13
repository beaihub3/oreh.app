import { fetchWithAuth, 
    N8N_GET_STATUS_URL,
    N8N_GET_DRIVE_FILES_URL,
    N8N_DELETE_DRIVE_FILE_URL,
    N8N_UPLOAD_DRIVE_FILE_URL,
    N8N_GET_AGENDA_URL,
    N8N_GET_ATENDIMENTOS_URL,
    N8N_GET_AI_SETTINGS_URL,
    N8N_UPDATE_AI_SETTINGS_URL
} from './api.js';

// Variáveis de estado da Agenda
const agendaStartHour = 7;
const agendaEndHour = 22;
let currentAgendaDate = new Date(); 

// =================================================================================
// FUNÇÕES DE UI GENÉRICAS
// =================================================================================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

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
                page.classList.toggle('active', page.id === `${targetPage}Page`);
            });
            
            pageTitle.textContent = this.querySelector('span')?.textContent || 'Dashboard';

            switch (targetPage) {
                case 'status':
                    updateConnectionStatus();
                    break;
                case 'agenda':
                    loadAgenda();
                    break;
                case 'atendimentos':
                    loadAtendimentos();
                    break;
                case 'drive':
                    loadDriveFiles();
                    break;
                case 'ia':
                    loadAiSettings(); // <<-- CHAMADA CORRETA
                    break;
            }
        });
    });
}

// Adicione esta função ao ui.js
function setupUploadModal() {
    const openUploadModalBtn = document.getElementById('openUploadModalBtn');
    const uploadModal = document.getElementById('uploadModal');
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');

    if (openUploadModalBtn) {
        openUploadModalBtn.addEventListener('click', () => {
            uploadModal.style.display = 'flex';
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = fileInput.files[0];
            if (!file) {
                showToast('Por favor, selecione um arquivo.', 'error');
                return;
            }

            // Você precisará criar este webhook no n8n
            const uploadUrl = N8N_UPLOAD_DRIVE_FILE_URL
            
            if (!uploadUrl) {
                showToast('URL de upload não configurada.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                // A função fetchWithAuth precisa ser adaptada para enviar multipart/form-data
                const token = localStorage.getItem('oreh_token');
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (response.ok) {
                    showToast('Arquivo enviado com sucesso!', 'success');
                    uploadModal.style.display = 'none';
                    loadDriveFiles(); // Recarrega a lista de arquivos
                } else {
                    const error = await response.json();
                    throw new Error(error.message || 'Falha no upload');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }
}

function setupModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    });
}


// =================================================================================
// FUNÇÕES DE PÁGINA
// =================================================================================

async function updateConnectionStatus() {
    // Substituído window.userWebhooks pela constante importada
    const webhookUrl = N8N_GET_STATUS_URL; 
    if (!webhookUrl) return showToast('URL de Status não configurada.', 'error');
    
    const statusElement = document.getElementById('connectionStatus');
    const qrCodeOutput = document.getElementById('qrcode-output');
    const disconnectBtn = document.getElementById('disconnectBtn');

    statusElement.textContent = 'VERIFICANDO CONEXÃO...';
    try {
        const response = await fetchWithAuth(webhookUrl);
        const data = await response.json();
        const statusData = Array.isArray(data) ? data[0] : data;

        if (statusData?.data?.instance?.state === 'open') {
            statusElement.textContent = 'CONECTADO';
            disconnectBtn.style.display = 'block';
            qrCodeOutput.innerHTML = '<p>Telefone conectado.</p>';
        } else if (statusData?.data?.base64) {
            statusElement.textContent = 'AGUARDANDO CONEXÃO';
            disconnectBtn.style.display = 'none';
            qrCodeOutput.innerHTML = `<img src="${statusData.data.base64}" alt="QR Code para conexão">`;
        } else {
            statusElement.textContent = 'DESCONECTADO';
            disconnectBtn.style.display = 'none';
            qrCodeOutput.innerHTML = '<p>Telefone desconectado.</p>';
        }
    } catch (error) {
        console.error('[OREH] Erro ao verificar status:', error);
        showToast('Erro ao buscar status da conexão.', 'error');
    }
}

async function loadDriveFiles() {
    // Substituído window.userWebhooks pela constante importada
    const webhookUrl = N8N_GET_DRIVE_FILES_URL; 
    if (!webhookUrl) return showToast('URL do Drive não configurada.', 'error');

    const fileGrid = document.getElementById('fileGrid');
    fileGrid.innerHTML = '<p>Carregando arquivos...</p>';

    try {
        const response = await fetchWithAuth(webhookUrl);
        const files = await response.json();
        fileGrid.innerHTML = '';

        if (!files || files.length === 0) {
            fileGrid.innerHTML = '<p>Nenhum arquivo encontrado.</p>';
            return;
        }

        files.forEach(file => {
            const viewLink = `https://drive.google.com/file/d/${file.id}/view`;
            
            const card = document.createElement('div');
            card.className = 'file-card';
            card.innerHTML = `
                <a href="${viewLink}" target="_blank" class="file-card-link">
                    <div class="file-icon"><i class="fas fa-file-alt"></i></div>
                    <span class="file-name">${file.name}</span>
                </a>
                <button class="btn btn-danger delete-file-btn" data-file-id="${file.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            fileGrid.appendChild(card);
        });

        document.querySelectorAll('.delete-file-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const fileId = e.currentTarget.dataset.fileId;
                await deleteDriveFile(fileId);
            });
        });
        
    } catch (error) {
        console.error('[OREH] Erro ao carregar ficheiros do Drive:', error);
        showToast('Arquivos não encontrados.', 'error');
    }
}


async function deleteDriveFile(fileId) {
    const webhookUrl = N8N_DELETE_DRIVE_FILE_URL;
    if (!webhookUrl) return showToast('URL para deletar arquivos não configurada.', 'error');

    try {
        const response = await fetchWithAuth(webhookUrl, {
            method: 'POST',
            body: JSON.stringify({ id: fileId })
        });
        
        if (response.ok) {
            showToast('Arquivo deletado com sucesso!', 'success');
            loadDriveFiles(); 
        } else {
            throw new Error('Falha ao deletar arquivo');
        }
    } catch (error) {
        console.error('[OREH] Erro ao deletar arquivo:', error);
        showToast(error.message, 'error');
    }
}

async function loadAgenda() {
    const webhookUrl = N8N_GET_AGENDA_URL;
    if (!webhookUrl) return showToast('URL da Agenda não configurada.', 'error');
    
    try {
        const response = await fetchWithAuth(webhookUrl);
        const events = await response.json();
        renderAgenda(events);
    } catch (error) {
        console.error("Erro ao carregar agenda:", error);
        showToast("Falha ao carregar eventos da agenda.", 'error');
    }
}

function renderAgenda(events) {
    const timeline = document.getElementById('agendaTimeline');
    const header = document.getElementById('agendaHeader');
    const body = document.getElementById('agendaBody');

    timeline.innerHTML = '';
    header.innerHTML = '';
    body.innerHTML = '';

    for (let hour = agendaStartHour; hour < agendaEndHour; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.dataset.time = `${hour.toString().padStart(2, '0')}:00`;
        timeline.appendChild(timeSlot);
    }
    
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(currentAgendaDate);
        dayDate.setDate(currentAgendaDate.getDate() - currentAgendaDate.getDay() + i);

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = dayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
        header.appendChild(dayHeader);

        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        dayColumn.dataset.date = dayDate.toISOString().split('T')[0];
        body.appendChild(dayColumn);
    }

    events.forEach(event => {
        const eventDateStr = new Date(event.data).toISOString().split('T')[0];
        const targetColumn = body.querySelector(`.day-column[data-date="${eventDateStr}"]`);

        if (targetColumn) {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.textContent = event.assunto;

            const [startHour, startMinute] = event.hora_inicio.split(':').map(Number);
            const [endHour, endMinute] = event.hora_fim.split(':').map(Number);

            const topPosition = ((startHour - agendaStartHour) * 60) + startMinute;
            const durationInMinutes = ((endHour * 60) + endMinute) - ((startHour * 60) + startMinute);
            
            eventCard.style.top = `${topPosition}px`;
            eventCard.style.height = `${durationInMinutes}px`;

            Object.keys(event).forEach(key => {
                if(event[key] !== null) eventCard.dataset[key] = event[key];
            });

            targetColumn.appendChild(eventCard);
        }
    });
}

async function loadAtendimentos() {
    const webhookUrl = N8N_GET_ATENDIMENTOS_URL;
    if (!webhookUrl) return showToast('URL de Atendimentos não configurada.', 'error');

    const chatsGrid = document.getElementById('chatsGrid');
    chatsGrid.innerHTML = '<p>A carregar atendimentos...</p>';

    try {
        const response = await fetchWithAuth(webhookUrl);
        const chats = await response.json();
        renderAtendimentos(chats);
    } catch (error)
        {
        console.error("Erro ao carregar atendimentos:", error);
        showToast('Não foi possível carregar os atendimentos.', 'error');
        chatsGrid.innerHTML = '<p>Ocorreu um erro ao carregar os atendimentos.</p>';
    }
}

function renderAtendimentos(chats) {
    const chatsGrid = document.getElementById('chatsGrid');
    chatsGrid.innerHTML = '';

    if (!chats || chats.length === 0) {
        chatsGrid.innerHTML = '<p>Nenhum atendimento encontrado.</p>';
        return;
    }

    chats.forEach(chat => {
        const chatCard = document.createElement('div');
        chatCard.className = 'chat-card';
        chat.status = chat.status.replace('_', ' ');
        chatCard.dataset.status = chat.status;

        const createdAt = new Date(chat.created_at);
        const formattedDate = createdAt.toLocaleDateString('pt-BR');
        chat.formatted_created_at = `${formattedDate} às ${createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

        chatCard.innerHTML = `
            <div class="chat-info">
                <span class="customer-name">${chat.customer_name}</span>
                <p class="last-message">${chat.last_message_summary || 'Nenhuma mensagem.'}</p>
            </div>
            <div class="chat-meta">
                <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                <span class="status-badge" data-status="${chat.status}">${chat.status}</span>
            </div>
        `;

        Object.keys(chat).forEach(key => {
            if(chat[key] !== null) chatCard.dataset[key] = chat[key];
        });

        chatsGrid.appendChild(chatCard);
    });
}

// =================================================================================
// FUNÇÕES DA PÁGINA "GESTÃO DE IA" (ATUALIZADAS)
// =================================================================================

async function loadAiSettings() {
    console.log("[OREH] Carregando configurações de IA...");
    const webhookUrl = N8N_GET_AI_SETTINGS_URL;
    if (!webhookUrl) return showToast('URL de Gestão de IA não configurada.', 'error');

    try {
        const response = await fetchWithAuth(webhookUrl);
        const settings = await response.json();
        
        // A resposta do n8n pode vir como um array, pegamos o primeiro item.
        const companySettings = Array.isArray(settings) ? settings[0] : settings;

        if (companySettings) {
            // Mapeia os dados do banco para os campos do formulário
            document.getElementById('aiActiveToggle').checked = companySettings.is_ai_active;
            document.getElementById('basePrompt').value = companySettings.base_prompt || '';
            document.getElementById('personalityStyle').value = companySettings.ai_personality_style || 'amigavel';
            document.getElementById('dominantTraits').value = companySettings.ai_dominant_traits || 'curioso';
            document.getElementById('toneFormality').value = companySettings.ai_tone_formality || 'casual';
            document.getElementById('toneAdaptability').checked = companySettings.ai_tone_adaptability;
            document.getElementById('languageComplexity').value = companySettings.ai_language_complexity || 'simples';
            document.getElementById('agentFunction').value = companySettings.ai_agent_function || 'vendedor';
            showToast('Configurações de IA carregadas.', 'info');
        } else {
             showToast('Nenhuma configuração de IA encontrada para sua empresa.', 'warning');
        }
    } catch (error) {
        console.error('[OREH] Erro ao carregar configurações de IA:', error);
        showToast('Falha ao carregar as configurações de IA.', 'error');
    }
}

async function saveAiSettings() {
    console.log("[OREH] Salvando configurações de IA...");
    const webhookUrl = N8N_UPDATE_AI_SETTINGS_URL;
    if (!webhookUrl) return showToast('URL para salvar configurações não definida.', 'error');

    const saveBtn = document.getElementById('saveAiSettingsBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    // Coleta todos os dados do formulário e mapeia para os nomes de coluna do banco
    const settingsData = {
        is_ai_active: document.getElementById('aiActiveToggle').checked,
        base_prompt: document.getElementById('basePrompt').value,
        ai_personality_style: document.getElementById('personalityStyle').value,
        ai_dominant_traits: document.getElementById('dominantTraits').value,
        ai_tone_formality: document.getElementById('toneFormality').value,
        ai_tone_adaptability: document.getElementById('toneAdaptability').checked,
        ai_language_complexity: document.getElementById('languageComplexity').value,
        ai_agent_function: document.getElementById('agentFunction').value
    };

    try {
        const response = await fetchWithAuth(webhookUrl, {
            method: 'POST', // Pode ser 'POST' ou 'PUT', dependendo de como você configurar o n8n
            body: JSON.stringify(settingsData)
        });
        
        const result = await response.json();
        showToast(result.message || 'Configurações salvas com sucesso!', 'success');

    } catch (error) {
        console.error('[OREH] Erro ao salvar configurações de IA:', error);
        showToast('Ocorreu um erro ao salvar as alterações.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar Alterações';
    }
}

// =================================================================================
// FUNÇÃO PARA ATUALIZAR INFO DO USUÁRIO NA UI
// =================================================================================
function updateUserInfo(name, initial) {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userAvatar = document.querySelector('.user-avatar');

    if (userNameDisplay && name) {
        userNameDisplay.textContent = name;
    }

    if (userAvatar && initial) {
        userAvatar.textContent = initial;
    }
}

// Exporta todas as funções para serem usadas no main.js
export {
    showToast,
    setupNavigation,
    setupModals,
    setupUploadModal,
    updateConnectionStatus,
    loadDriveFiles,
    deleteDriveFile,
    loadAiSettings,
    saveAiSettings,
    loadAgenda,
    loadAtendimentos,
    updateUserInfo
};