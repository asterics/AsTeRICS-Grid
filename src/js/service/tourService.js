import Shepherd from 'shepherd.js';
import { i18nService } from './i18nService';

let tourService = {};
let currentTour = null;
let tourConfig = null;

// Tour configurations for different views
const TOUR_CONFIGS = {
    welcome: {
        id: 'welcome-tour',
        title: 'Welcome to AsTeRICS Grid',
        steps: [
            {
                id: 'welcome-intro',
                title: 'Welcome!',
                text: 'Let\'s take a quick tour to help you get started with AsTeRICS Grid.',
                buttons: [
                    {
                        text: 'Skip Tour',
                        action: () => tourService.endTour(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'welcome-options',
                title: 'Getting Started',
                text: 'You have several options to get started. You can create a new user account, use the app without registration, or take this tour to learn more.',
                attachTo: {
                    element: '[data-tour-trigger="welcome"]',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'welcome-help',
                title: 'Need Help?',
                text: 'You can always access help by clicking the help button or pressing F1 on your keyboard.',
                attachTo: {
                    element: '#helpButton',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Finish',
                        action: () => tourService.endTour(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            }
        ]
    },
    mainView: {
        id: 'main-view-tour',
        title: 'Main View Tour',
        steps: [
            {
                id: 'main-intro',
                title: 'Main View',
                text: 'This is the main view where you interact with your grids. You can navigate between different grids and use various features.',
                attachTo: {
                    element: '[data-tour-trigger="mainView"]',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Skip Tour',
                        action: () => tourService.endTour(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'main-navigation',
                title: 'Navigation Sidebar',
                text: 'Use the navigation sidebar to access different sections: Main view, Manage grids, Dictionaries, Users, Settings, and Help.',
                attachTo: {
                    element: 'nav',
                    on: 'right'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'main-grid',
                title: 'Grid Elements',
                text: 'Click on grid elements to interact with them. Some elements will navigate to other grids, while others perform actions.',
                attachTo: {
                    element: '.grid-container',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'main-collection',
                title: 'Collection Element',
                text: 'This element collects your selections and builds sentences. It helps you communicate by combining different elements.',
                attachTo: {
                    element: '.collect-element',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Finish',
                        action: () => tourService.endTour(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            }
        ]
    },
    editView: {
        id: 'edit-view-tour',
        title: 'Edit View Tour',
        steps: [
            {
                id: 'edit-intro',
                title: 'Edit Mode',
                text: 'You\'re now in edit mode where you can modify your grids. Here you can add, remove, and configure grid elements.',
                attachTo: {
                    element: '[data-tour-trigger="editView"]',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Skip Tour',
                        action: () => tourService.endTour(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'edit-toolbar',
                title: 'Edit Toolbar',
                text: 'Use these tools to edit your grid: Undo/Redo, More options, and switch back to normal view.',
                attachTo: {
                    element: '.edit-toolbar',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'edit-elements',
                title: 'Editing Elements',
                text: 'Right-click on elements to edit them, or drag and drop to reposition. You can also resize elements from the bottom-right corner.',
                attachTo: {
                    element: '.grid-container',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Finish',
                        action: () => tourService.endTour(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            }
        ]
    },
    manageGrids: {
        id: 'manage-grids-tour',
        title: 'Manage Grids Tour',
        steps: [
            {
                id: 'manage-intro',
                title: 'Manage Grids',
                text: 'This view allows you to manage all your grids. You can create new grids, edit existing ones, and organize your grid collection.',
                attachTo: {
                    element: '[data-tour-trigger="manageGrids"]',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Skip Tour',
                        action: () => tourService.endTour(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'manage-grid-list',
                title: 'Grid List',
                text: 'Here you can see all your grids. Click on any grid to select it and view its details or perform actions.',
                attachTo: {
                    element: '.grid-list',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'manage-actions',
                title: 'Grid Actions',
                text: 'When a grid is selected, you can perform various actions: Show, Edit, Clone, Delete, Export, or Save as PDF.',
                attachTo: {
                    element: '#actionGroup',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'manage-global-grid',
                title: 'Global Grid',
                text: 'The global grid is shown on every page. You can activate, edit, or reset it to default settings.',
                attachTo: {
                    element: '#globalGridActions',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Next',
                        action: () => currentTour.next(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            },
            {
                id: 'manage-home-grid',
                title: 'Home Grid',
                text: 'Set a home grid that opens automatically when you start AsTeRICS Grid, or choose to always open the last used grid.',
                attachTo: {
                    element: '#selectHomeGrid',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Previous',
                        action: () => currentTour.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Finish',
                        action: () => tourService.endTour(),
                        classes: 'shepherd-button-primary'
                    }
                ]
            }
        ]
    }
};

/**
 * Initialize the tour service
 */
tourService.init = function () {
    // Set default Shepherd options
    Shepherd.defaults = {
        classes: 'shepherd-theme-arrows',
        scrollTo: true,
        cancelIcon: {
            enabled: true
        }
    };
};

/**
 * Start a tour for a specific view
 * @param {string} tourType - Type of tour to start ('welcome', 'mainView', 'editView')
 * @param {Object} options - Additional options for the tour
 */
tourService.startTour = function (tourType, options = {}) {
    if (currentTour) {
        currentTour.complete();
    }
    
    const config = TOUR_CONFIGS[tourType];
    if (!config) {
        console.error(`Tour type '${tourType}' not found`);
        return;
    }
    
    // Create new tour instance
    currentTour = new Shepherd.Tour({
        id: config.id,
        defaultStepOptions: {
            cancelIcon: {
                enabled: true
            },
            scrollTo: true,
            classes: 'shepherd-theme-arrows'
        },
        ...options
    });
    
    // Add steps to tour
    config.steps.forEach(step => {
        currentTour.addStep({
            id: step.id,
            title: step.title,
            text: step.text,
            attachTo: step.attachTo,
            buttons: step.buttons,
            highlightClass: 'tour-highlight'
        });
    });
    
    // Start the tour
    currentTour.start();
    
    // Store tour config for reference
    tourConfig = config;
    
    return currentTour;
};

/**
 * End the current tour
 */
tourService.endTour = function () {
    if (currentTour) {
        currentTour.complete();
        currentTour = null;
        tourConfig = null;
    }
};

/**
 * Check if a tour is currently active
 * @returns {boolean} True if a tour is active
 */
tourService.isTourActive = function () {
    return currentTour !== null;
};

/**
 * Get the current tour instance
 * @returns {Shepherd.Tour|null} Current tour instance or null
 */
tourService.getCurrentTour = function () {
    return currentTour;
};

/**
 * Add custom tour step
 * @param {Object} step - Step configuration
 */
tourService.addCustomStep = function (step) {
    if (currentTour) {
        currentTour.addStep(step);
    }
};

/**
 * Go to next step in current tour
 */
tourService.nextStep = function () {
    if (currentTour) {
        currentTour.next();
    }
};

/**
 * Go to previous step in current tour
 */
tourService.previousStep = function () {
    if (currentTour) {
        currentTour.back();
    }
};

/**
 * Go to specific step by ID
 * @param {string} stepId - ID of the step to go to
 */
tourService.goToStep = function (stepId) {
    if (currentTour) {
        const stepIndex = currentTour.steps.findIndex(step => step.id === stepId);
        if (stepIndex !== -1) {
            currentTour.show(stepIndex);
        }
    }
};

// Initialize when module is imported
tourService.init();

export { tourService };
