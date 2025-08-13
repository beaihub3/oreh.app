import { checkLoginState, login, logout } from './auth.js';
import { 
    setupNavigation, 
    setupModals,
    setupUploadModal,
    saveAiSettings,
    loadAgenda, 
    loadAtendimentos 
} from './ui.js'; 

console.log('[OREH] Módulo principal carregado.');

function setupEventListeners() {
    console.log('[OREH] Configurando listeners de eventos globais...');
    
    // Autenticação - Add null checks
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', login);
    
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', e => { 
            if (e.key === 'Enter') login(); 
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Gestão de IA - Add null check
    const saveAiSettingsBtn = document.getElementById('saveAiSettingsBtn');
    if (saveAiSettingsBtn) {
        saveAiSettingsBtn.addEventListener('click', saveAiSettings);
    }


// Listener para os cards de ATENDIMENTO
const chatsGrid = document.getElementById('chatsGrid');
if (chatsGrid) {
    chatsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.chat-card');
        if (!card) return;

        const modal = document.getElementById('chatDetailModal');
        if (!modal) return;

        // Função para definir o texto de um elemento com segurança
        const setText = (id, text) => {
            const el = modal.querySelector(id);
            if (el) el.textContent = text || 'N/A';
        };

        const status = (card.dataset.status || 'N/A').replace(/_/g, ' ');
        const statusEl = modal.querySelector('#chatDetailStatus');

        setText('#chatDetailCustomer', card.dataset.customer_name);
        setText('#chatDetailPhone', card.dataset.customer_phone);
        setText('#chatDetailCreated', card.dataset.formatted_created_at || new Date(card.dataset.created_at).toLocaleString('pt-BR'));
        setText('#chatDetailSummary', card.dataset.last_message_summary || 'Nenhuma informação.');

        if (statusEl) {
            statusEl.textContent = status;
            // Remove classes antigas e adiciona a nova para a cor correta
            statusEl.className = 'status-badge'; 
            statusEl.classList.add(status.toLowerCase());
            statusEl.dataset.status = card.dataset.status;
        }

        modal.style.display = 'flex';
    });
}

    // Listener para os cards da AGENDA - Add null checks
    const agendaBody = document.getElementById('agendaBody');
    if (agendaBody) {
        agendaBody.addEventListener('click', (e) => {
            const card = e.target.closest('.event-card');
            if (!card) return;

            // Add null checks for each modal element
            const assuntoEl = document.getElementById('eventDetailAssunto');
            const dataEl = document.getElementById('eventDetailData');
            const horarioEl = document.getElementById('eventDetailHorario');
            const clienteEl = document.getElementById('eventDetailCliente');
            const telefoneEl = document.getElementById('eventDetailTelefone');
            const localEl = document.getElementById('eventDetailLocal');
            const modalEl = document.getElementById('eventDetailModal');

            if (assuntoEl) assuntoEl.textContent = card.dataset.assunto || 'Evento sem título';
            if (dataEl) dataEl.textContent = card.dataset.formatted_date || new Date(card.dataset.data).toLocaleDateString('pt-BR');
            if (horarioEl) horarioEl.textContent = `${card.dataset.hora_inicio} - ${card.dataset.hora_fim}`;
            if (clienteEl) clienteEl.textContent = card.dataset.cliente || 'N/A';
            if (telefoneEl) telefoneEl.textContent = card.dataset.telefone || 'N/A';
            if (localEl) localEl.textContent = card.dataset.local || 'N/A';
            if (modalEl) modalEl.style.display = 'flex';
        });
    }
    
    console.log('[OREH] Listeners configurados.');
}

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupModals();
    setupUploadModal();
    setupEventListeners();
    checkLoginState(); 
});
