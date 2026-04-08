// ========================================
// EMILUXE - FORM HANDLER
// ========================================
// Manejo de validación de formularios
// para el sistema de compra contra entrega

/**
 * Validar nombre completo
 * @param {string} fullName - Nombre a validar
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateFullName(fullName) {
  const trimmed = fullName.trim();
  
  if (!trimmed) {
    return {
      valid: false,
      error: '❌ El nombre no puede estar vacío'
    };
  }

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: '❌ El nombre debe tener al menos 3 caracteres'
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: '❌ El nombre no puede tener más de 100 caracteres'
    };
  }

  // Validar que solo contenga letras, espacios y acentos
  const nameRegex = /^[a-záéíóúñ\s]+$/i;
  if (!nameRegex.test(trimmed)) {
    return {
      valid: false,
      error: '❌ El nombre solo puede contener letras'
    };
  }

  return {
    valid: true,
    error: ''
  };
}

/**
 * Validar número de teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {Object} { valid: boolean, error: string }
 */
export function validatePhoneNumber(phone) {
  const trimmed = phone.trim();

  if (!trimmed) {
    return {
      valid: false,
      error: '❌ El teléfono no puede estar vacío'
    };
  }

  // Solo dígitos
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(trimmed)) {
    return {
      valid: false,
      error: '❌ El teléfono debe tener exactamente 10 dígitos'
    };
  }

  return {
    valid: true,
    error: ''
  };
}

/**
 * Validar teléfono secundario (opcional)
 * @param {string} phone - Teléfono a validar
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateSecondaryPhone(phone) {
  const trimmed = phone.trim();

  // Si está vacío, es válido (opcional)
  if (!trimmed) {
    return {
      valid: true,
      error: ''
    };
  }

  // Si no está vacío, debe cumplir con el formato
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(trimmed)) {
    return {
      valid: false,
      error: '❌ El teléfono secundario debe tener 10 dígitos'
    };
  }

  return {
    valid: true,
    error: ''
  };
}

/**
 * Validar dirección
 * @param {string} address - Dirección a validar
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateAddress(address) {
  const trimmed = address.trim();

  if (!trimmed) {
    return {
      valid: false,
      error: '❌ La dirección no puede estar vacía'
    };
  }

  if (trimmed.length < 10) {
    return {
      valid: false,
      error: '❌ La dirección debe tener al menos 10 caracteres'
    };
  }

  if (trimmed.length > 200) {
    return {
      valid: false,
      error: '❌ La dirección no puede tener más de 200 caracteres'
    };
  }

  return {
    valid: true,
    error: ''
  };
}

/**
 * Validar hora de preferencia
 * @param {string} time - Hora a validar
 * @returns {Object} { valid: boolean, error: string }
 */
export function validatePreferredTime(time) {
  if (!time) {
    return {
      valid: false,
      error: '❌ Debes seleccionar una hora de preferencia'
    };
  }

  const validTimes = ['08:00-12:00', '12:00-16:00', '16:00-20:00', 'flexible'];
  if (!validTimes.includes(time)) {
    return {
      valid: false,
      error: '❌ Hora de preferencia no válida'
    };
  }

  return {
    valid: true,
    error: ''
  };
}

/**
 * Validar notas adicionales (opcional)
 * @param {string} notes - Notas a validar
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateNotes(notes) {
  const trimmed = notes.trim();

  // Si está vacío, es válido (opcional)
  if (!trimmed) {
    return {
      valid: true,
      error: ''
    };
  }

  if (trimmed.length > 500) {
    return {
      valid: false,
      error: '❌ Las notas no pueden tener más de 500 caracteres'
    };
  }

  return {
    valid: true,
    error: ''
  };
}

/**
 * Validar todo el formulario de envío
 * @param {Object} formData - Datos del formulario
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateDeliveryForm(formData) {
  const errors = {};
  let isValid = true;

  // Validar nombre
  const nameValidation = validateFullName(formData.fullName);
  if (!nameValidation.valid) {
    errors.fullName = nameValidation.error;
    isValid = false;
  }

  // Validar teléfono principal
  const phoneValidation = validatePhoneNumber(formData.mainPhone);
  if (!phoneValidation.valid) {
    errors.mainPhone = phoneValidation.error;
    isValid = false;
  }

  // Validar teléfono secundario
  const secondaryPhoneValidation = validateSecondaryPhone(formData.secondaryPhone);
  if (!secondaryPhoneValidation.valid) {
    errors.secondaryPhone = secondaryPhoneValidation.error;
    isValid = false;
  }

  // Validar dirección
  const addressValidation = validateAddress(formData.address);
  if (!addressValidation.valid) {
    errors.address = addressValidation.error;
    isValid = false;
  }

  // Validar hora
  const timeValidation = validatePreferredTime(formData.preferredTime);
  if (!timeValidation.valid) {
    errors.preferredTime = timeValidation.error;
    isValid = false;
  }

  // Validar notas
  const notesValidation = validateNotes(formData.notes);
  if (!notesValidation.valid) {
    errors.notes = notesValidation.error;
    isValid = false;
  }

  return {
    valid: isValid,
    errors: errors
  };
}

/**
 * Obtener datos del formulario
 * @returns {Object} Datos del formulario
 */
export function getFormData() {
  return {
    fullName: document.getElementById('fullName')?.value || '',
    mainPhone: document.getElementById('mainPhone')?.value || '',
    secondaryPhone: document.getElementById('secondaryPhone')?.value || '',
    address: document.getElementById('address')?.value || '',
    preferredTime: document.getElementById('preferredTime')?.value || '',
    notes: document.getElementById('notes')?.value || ''
  };
}

/**
 * Mostrar errores en el formulario
 * @param {Object} errors - Objeto con errores por campo
 */
export function displayFormErrors(errors) {
  // Limpiar errores anteriores
  const errorElements = document.querySelectorAll('.form-error');
  errorElements.forEach(el => el.remove());

  // Mostrar nuevos errores
  Object.keys(errors).forEach(field => {
    const fieldElement = document.getElementById(field);
    if (fieldElement) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'form-error';
      errorDiv.textContent = errors[field];
      errorDiv.style.cssText = `
        color: #d32f2f;
        font-size: 0.85rem;
        margin-top: 0.3rem;
        display: block;
      `;
      fieldElement.parentNode.insertBefore(errorDiv, fieldElement.nextSibling);
    }
  });
}

/**
 * Limpiar errores del formulario
 */
export function clearFormErrors() {
  const errorElements = document.querySelectorAll('.form-error');
  errorElements.forEach(el => el.remove());
}

/**
 * Formatear hora de preferencia para mostrar
 * @param {string} time - Hora a formatear
 * @returns {string} Hora formateada
 */
export function formatPreferredTime(time) {
  const timeFormats = {
    '08:00-12:00': '08:00 AM - 12:00 PM',
    '12:00-16:00': '12:00 PM - 04:00 PM',
    '16:00-20:00': '04:00 PM - 08:00 PM',
    'flexible': 'Flexible (cualquier hora)'
  };

  return timeFormats[time] || time;
}

/**
 * Exportar datos del formulario como JSON
 * @returns {string} JSON con datos del formulario
 */
export function exportFormDataAsJSON() {
  const formData = getFormData();
  return JSON.stringify(formData, null, 2);
}

export default {
  validateFullName,
  validatePhoneNumber,
  validateSecondaryPhone,
  validateAddress,
  validatePreferredTime,
  validateNotes,
  validateDeliveryForm,
  getFormData,
  displayFormErrors,
  clearFormErrors,
  formatPreferredTime,
  exportFormDataAsJSON
};
