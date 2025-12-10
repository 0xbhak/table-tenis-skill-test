import './style.css'
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { translations } from './translations.js';

let currentLang = 'id';

// Flag SVGs
const flags = {
  id: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 rounded-full shadow-sm" viewBox="0 0 512 512"><path fill="#e70011" d="M0 0h512v256H0z"/><path fill="#fff" d="M0 256h512v256H0z"/></svg>`,
  en: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 rounded-full shadow-sm" viewBox="0 0 60 60"><rect width="60" height="60" fill="#012169"/><path d="M0 0L60 60M60 0L0 60" stroke="#fff" stroke-width="8"/><path d="M0 0L60 60M60 0L0 60" stroke="#C8102E" stroke-width="4"/><path d="M30 0v60M0 30h60" stroke="#fff" stroke-width="12"/><path d="M30 0v60M0 30h60" stroke="#C8102E" stroke-width="8"/></svg>`
};

// Helper: Get Translation
const t = (key) => {
  return translations[currentLang][key] || key;
};

// Classification Logic
const classifyScore = (score) => {
  let key = '';
  if (score >= 0 && score <= 11) key = "kurang_baik";
  else if (score >= 12 && score <= 17) key = "cukup";
  else if (score >= 18 && score <= 23) key = "baik";
  else if (score >= 24 && score <= 30) key = "sangat_baik";
  else key = "invalid";
  
  return t(key);
};

// Modal Elements
const modal = document.getElementById('validationModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalContent = document.getElementById('modalContent');
const modalMessage = document.getElementById('modalMessage');
const closeModalBtn = document.getElementById('closeModalBtn');

// Modal Logic
const showModal = (message) => {
  if (message) modalMessage.textContent = message;
  
  modal.classList.remove('hidden');
  modal.classList.remove('pointer-events-none');
  
  // Transition in
  setTimeout(() => {
    modalBackdrop.classList.remove('opacity-0');
    modalContent.classList.remove('opacity-0', 'scale-90');
    modalContent.classList.add('scale-100');
  }, 10);
};

const closeModal = () => {
  // Transition out
  modalBackdrop.classList.add('opacity-0');
  modalContent.classList.remove('scale-100');
  modalContent.classList.add('opacity-0', 'scale-90');
  
  // Hide after transition
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.add('pointer-events-none');
  }, 300);
};

closeModalBtn.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

// Helper: Calculate Section Stats
const getSectionStats = (prefix) => {
  const inputs = Array.from(document.querySelectorAll(`input[name^="${prefix}_"]`));
  const values = inputs.map(input => parseInt(input.value)).filter(val => !isNaN(val));
  
  if (values.length === 0) return { mean: 0, classification: "-" };
  
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / 6;
  const classification = classifyScore(Math.round(mean));
  
  return { mean, classification };
};

// Update Section Mean Display
const updateSectionMean = (prefix) => {
  const stats = getSectionStats(prefix);
  // Ensure "classification" is localized because classifyScore uses currentLang
  const display = stats.classification === "-" ? "-" : `${stats.mean.toFixed(1)} (${stats.classification})`;
  document.getElementById(`score-${prefix}-avg`).textContent = display;
};

// Handle Input (Validation + Classification)
const handleInput = (input) => {
  const value = parseInt(input.value);
  const span = document.getElementById(`class-${input.id}`);
  
  // Reset if empty
  if (input.value === "") {
    if (span) span.textContent = "";
    if (input.name.includes('_')) updateSectionMean(input.name.split('_')[0]);
    return;
  }
  
  // Validation
  if (value < 0 || value > 30) {
    showModal(t('modal_message'));
    input.value = ""; 
    if (span) span.textContent = "";
    if (input.name.includes('_')) updateSectionMean(input.name.split('_')[0]);
    return;
  }

  // Live Classification
  if (span) {
    span.textContent = classifyScore(value);
  }
  
  // Update Section Mean
  if (input.name.includes('_')) {
     updateSectionMean(input.name.split('_')[0]);
  }
};

// Attach listeners to Inputs
const scoreInputs = document.querySelectorAll('input[type="number"]');
scoreInputs.forEach(input => {
  if (input.name.startsWith('gerak_') || input.name.startsWith('hasil_')) {
    // Use 'input' event for real-time updates
    input.addEventListener('input', () => handleInput(input));
  }
});

// Render Result Function
const renderResult = () => {
    // Get Data from DOM
    const name = document.getElementById('name').value;
    const age = document.getElementById('age').value;
    const genderVal = document.getElementById('gender').value; 
    // Handle gender label localization logic
    const gender = genderVal === 'L' ? t('laki_laki') : (genderVal === 'P' ? t('perempuan') : '-');
    
    // Calculate Scores
    const gerakStats = getSectionStats('gerak');
    const hasilStats = getSectionStats('hasil');
    
    // Check if we have valid stats to show
    if(gerakStats.classification === "-" || hasilStats.classification === "-") return;
    
    const totalScore = (gerakStats.mean + hasilStats.mean) / 2;
    // Calculate final class key
    let classKey = '';
    const roundedTotal = Math.round(totalScore);
    if (roundedTotal >= 0 && roundedTotal <= 11) classKey = "kurang_baik";
    else if (roundedTotal >= 12 && roundedTotal <= 17) classKey = "cukup";
    else if (roundedTotal >= 18 && roundedTotal <= 23) classKey = "baik";
    else if (roundedTotal >= 24 && roundedTotal <= 30) classKey = "sangat_baik";
    else classKey = "invalid";

    const totalClass = t(classKey);
    
    // Determine Message
    let message = "";
    let messageColor = "";
    if (classKey === "sangat_baik" || classKey === "baik") {
      message = t('msg_excellent');
      messageColor = "text-emerald-600";
    } else {
      message = t('msg_good');
      messageColor = "text-orange-600";
    }
    
    // Render Result
    const resultOutput = document.getElementById('resultOutput');
    resultOutput.innerHTML = `
      <section class="bg-white p-8 rounded-xl shadow-xl border-t-4 border-indigo-600 animate-fade-in">
        <h3 class="text-2xl font-bold text-slate-800 mb-6 text-center border-b pb-4">${t('hasil_perhitungan')}</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-8 text-slate-700">
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="font-medium text-slate-500">${t('nama_lengkap')}</span>
            <span class="font-bold">${name}</span>
          </div>
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="font-medium text-slate-500">${t('umur')}</span>
            <span class="font-bold">${age}</span>
          </div>
          <div class="flex justify-between border-b border-slate-100 pb-2">
            <span class="font-medium text-slate-500">${t('jenis_kelamin')}</span>
            <span class="font-bold">${gender}</span>
          </div>

          <div class="hidden md:block"></div> <!-- Spacer -->
          
          <div class="flex justify-between border-b border-slate-100 pb-2 items-center">
            <span class="font-medium text-slate-500">${t('tes_gerak')}</span>
            <span class="font-bold text-emerald-600">${gerakStats.mean.toFixed(1)} <span class="text-xs ml-1 text-slate-400 font-normal uppercase">(${gerakStats.classification})</span></span>
          </div>
          <div class="flex justify-between border-b border-slate-100 pb-2 items-center">
            <span class="font-medium text-slate-500">${t('hasil_tes')}</span>
            <span class="font-bold text-blue-600">${hasilStats.mean.toFixed(1)} <span class="text-xs ml-1 text-slate-400 font-normal uppercase">(${hasilStats.classification})</span></span>
          </div>
        </div>
        
        <div class="bg-indigo-50 p-6 rounded-xl text-center mb-6">
          <p class="text-sm text-indigo-500 font-semibold uppercase tracking-wider mb-1">${t('total_skor_akhir')}</p>
          <div class="text-4xl font-extrabold text-indigo-700 mb-2">${totalScore.toFixed(1)}</div>
          <div class="text-indigo-800 text-lg font-bold">
            ${totalClass}
          </div>
        </div>
        
        <div class="text-center">
          <p class="text-lg font-medium ${messageColor} italic mb-2">
            "${message}"
          </p>
          <p class="text-slate-400 text-sm mt-4 mb-6">${t('terima_kasih')}</p>
          
          <button id="downloadPdfBtn" class="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-6 rounded-lg shadow-lg flex items-center justify-center mx-auto transition duration-200 transform hover:-translate-y-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ${t('download_pdf')}
          </button>
        </div>
      </section>
    `;
    
    resultOutput.classList.remove('hidden');
    
    // PDF Download Logic
    attachPdfListener(name);
}

const attachPdfListener = (name) => {
    const btn = document.getElementById('downloadPdfBtn');
    if(!btn) return;
    
    btn.addEventListener('click', async () => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${t('generating')}`;
        btn.disabled = true;

        try {
            const originalElement = document.getElementById('resultOutput').querySelector('section');
            
            // 1. Clone the element to render it with a specific width (Desktop View)
            const clonedElement = originalElement.cloneNode(true);
            
            // 2. Style the clone to be off-screen but with fixed width
            // This forces the "desktop" layout even on mobile
            Object.assign(clonedElement.style, {
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                width: '1024px', // Standard desktop width for cleaner A4 layout
                zIndex: '-1',
                height: 'auto'
            });

            // 3. Remove the download button from the clone so it doesn't show up in PDF
            const clonedBtn = clonedElement.querySelector('#downloadPdfBtn');
            if (clonedBtn) {
                clonedBtn.remove();
            }
            
            // Append to body so html2canvas can render it
            document.body.appendChild(clonedElement);
            
            // 4. Capture the cloned element
            const canvas = await html2canvas(clonedElement, {
                scale: 2, // Higher resolution
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: 1024 // Hint for media queries if any
            });
            
            // 4. Remove the clone
            document.body.removeChild(clonedElement);
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });
            
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            // Add image to PDF (centered horizontally, some padding top)
            pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
            
            // Generate filename: Hasil-Tes-Tenis-Meja-[Nama].pdf
            const safeName = name.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
            pdf.save(`Hasil-Tes-Tenis-Meja-${safeName}.pdf`);
        
        } catch (error) {
            console.error("PDF check failed", error);
            alert("Gagal membuat PDF. Silakan coba lagi.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
};

// Custom Smooth Scroll Function
const smoothScrollTo = (targetY, duration = 1000) => {
    const startY = window.scrollY;
    const distance = targetY - startY;
    let startTime = null;

    const animation = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startY, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    // Ease In Out Quad function
    const ease = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    };

    requestAnimationFrame(animation);
};

// Submit Handler
document.querySelector('#scoreForm').addEventListener('submit', (e) => {
  e.preventDefault();
  renderResult();
  
  // Wait for render then scroll
  setTimeout(() => {
      const element = document.getElementById('resultOutput');
      if (element) {
          const y = element.getBoundingClientRect().top + window.scrollY - 40; 
          smoothScrollTo(y, 800);
      }
  }, 100);
});

// Update Language Function
const updatePageLanguage = () => {
    // 1. Static Text
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    // 2. Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    
    // 3. Toggle Button & Icon
    // Logic: Show CURRENT language on the button.
    document.getElementById('langLabel').textContent = currentLang === 'id' ? 'Indonesia' : 'English';
    document.getElementById('langIcon').innerHTML = flags[currentLang];
    
    // 4. Live Inputs (Classifications)
    // 4. Live Inputs (Classifications)
    document.querySelectorAll('input[type="number"]').forEach(input => {
        // Only update score inputs, skip age/phone to avoid invalid 0-30 validation
        if(input.value !== "" && (input.name.startsWith('gerak_') || input.name.startsWith('hasil_'))) {
            handleInput(input);
        }
    });
    
    // 5. Result Section (if visible)
    if (!document.getElementById('resultOutput').classList.contains('hidden')) {
        renderResult();
    }
};

// Language Toggle Handler
document.getElementById('langToggleBtn').addEventListener('click', () => {
    currentLang = currentLang === 'id' ? 'en' : 'id';
    updatePageLanguage();
});

// Reset Handler
document.getElementById('resetBtn').addEventListener('click', () => {
  // 1. Reset Form (Inputs)
  document.getElementById('scoreForm').reset();
  
  // 2. Clear Live Classifications (Spans)
  document.querySelectorAll('span[id^="class-"]').forEach(span => span.textContent = "");
  
  // 3. Clear Section Means - Reset to "-"
  document.getElementById('score-gerak-avg').textContent = "-";
  document.getElementById('score-hasil-avg').textContent = "-";
  
  // 4. Hide Result Output
  document.getElementById('resultOutput').classList.add('hidden');
  
  
  // 5. Scroll to top with custom smooth scroll
  smoothScrollTo(0, 800);
});

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Ensure text is correct on load
    updatePageLanguage();
    
    // Fade in content (prevent FOUC)
    const app = document.getElementById('app');
    if (app) {
        // Use timeout to ensure browser paints the initial hidden state
        setTimeout(() => {
            app.style.opacity = '1';
        }, 100);
    }
});

