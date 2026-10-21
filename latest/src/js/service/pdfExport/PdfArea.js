class PdfArea {
    /**
     * Creates an instance of PdfArea.
     *
     * @param {Object} [options={}] - The configuration options for the area.
     * @param {number} [options.x=0] - The horizontal coordinate of the top-left corner.
     * @param {number} [options.y=0] - The vertical coordinate of the top-left corner.
     * @param {number} [options.width=0] - The width of the area.
     * @param {number} [options.height=0] - The height of the area.
     * @param {import('jspdf').jsPDF} options.doc - The jsPDF document instance.
     * @param {import('jspdf')} options.jsPdfModule - imported total jspdfModule
     */
    constructor({ x = 0, y = 0, width = 0, height = 0, doc = null, jsPdfModule = null } = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.doc = doc;
        this.jsPdfModule = jsPdfModule;
    }

    /**
     * Draws a semi-transparent filled rectangle and optionally prints text at the top-left corner,
     * restoring all previous graphics states and colors afterward.
     *
     * @param {import('jspdf').jsPDF} doc - The jsPDF document instance.
     * @param {import('jspdf')} jspdfModule - imported total jspdfModule
     * @param {number[]|string} color - RGB array (e.g. [255, 0, 0]) or hex/name string (e.g. '#ff0000').
     * @param {string} [text] - Optional text to print at the top-left corner.
     */
    mark(color, text = '') {
        const previousFillColor = this.doc.getFillColor();
        const previousTextColor = this.doc.getTextColor();

        this.doc.saveGraphicsState();
        this.doc.setGState(new this.jsPdfModule.GState({ opacity: 0.5 }));

        if (Array.isArray(color)) {
            this.doc.setFillColor(color[0], color[1], color[2]);
        } else {
            this.doc.setFillColor(color);
        }

        this.doc.rect(this.x, this.y, this.width, this.height, 'F');
        if (text) {
            this.doc.setGState(new this.jsPdfModule.GState({ opacity: 1.0 }));
            const padding = 2;
            this.doc.text(text, this.x + padding, this.y + padding, { baseline: 'top' });
        }

        this.doc.restoreGraphicsState();
        this.doc.setFillColor(previousFillColor);
        this.doc.setTextColor(previousTextColor);
    }

    fill(color) {
        if (Array.isArray(color)) {
            this.doc.setFillColor(color[0], color[1], color[2]);
        } else {
            this.doc.setFillColor(color);
        }
        this.doc.rect(this.x, this.y, this.width, this.height, 'F');
    }
}

export {PdfArea};