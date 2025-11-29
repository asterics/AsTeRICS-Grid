/**
 * Toast Notification Service
 * Service global pour afficher des notifications toast dans l'application
 */

let toastService = {};
let _toastComponent = null;

/**
 * Initialise le service de toast avec le composant Vue
 * @param {Object} component - Référence au composant toast-notification
 */
toastService.init = function(component) {
    _toastComponent = component;
};

/**
 * Affiche un toast de succès
 * @param {String|Object} options - Message ou objet d'options
 */
toastService.success = function(options) {
    return show(normalizeOptions(options, 'success'));
};

/**
 * Affiche un toast d'erreur
 * @param {String|Object} options - Message ou objet d'options
 */
toastService.error = function(options) {
    return show(normalizeOptions(options, 'error'));
};

/**
 * Affiche un toast d'avertissement
 * @param {String|Object} options - Message ou objet d'options
 */
toastService.warning = function(options) {
    return show(normalizeOptions(options, 'warning'));
};

/**
 * Affiche un toast d'information
 * @param {String|Object} options - Message ou objet d'options
 */
toastService.info = function(options) {
    return show(normalizeOptions(options, 'info'));
};

/**
 * Retire un toast spécifique
 * @param {Number} id - ID du toast à retirer
 */
toastService.remove = function(id) {
    if (_toastComponent) {
        _toastComponent.remove(id);
    }
};

/**
 * Retire tous les toasts
 */
toastService.clear = function() {
    if (_toastComponent) {
        _toastComponent.clear();
    }
};

/**
 * Change la position des toasts
 * @param {String} position - Position ('top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center')
 */
toastService.setPosition = function(position) {
    if (_toastComponent) {
        _toastComponent.setPosition(position);
    }
};

/**
 * Normalise les options de toast
 * @private
 */
function normalizeOptions(options, type) {
    if (typeof options === 'string') {
        return { message: options, type };
    }
    return { ...options, type };
}

/**
 * Affiche un toast
 * @private
 */
function show(options) {
    if (!_toastComponent) {
        console.warn('Toast service not initialized. Call toastService.init() first.');
        return null;
    }
    return _toastComponent.add(options);
}

export { toastService };
