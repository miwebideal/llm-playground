// src/tests/core/services/safe-markdown.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { SafeMarkdownService, safeUrl } from '../../../app/core/services/safe-markdown.service';

describe('SafeMarkdownService', () => {
    let service: SafeMarkdownService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SafeMarkdownService);
    });

    it('safeUrl sólo deja pasar protocolos permitidos', () => {
        expect(safeUrl('https://a.com/x')).toBe('https://a.com/x');
        expect(safeUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
        expect(safeUrl('javascript:alert(1)')).toBeNull();
        expect(safeUrl('JaVaScRiPt:alert(1)')).toBeNull();
        expect(safeUrl(' javascript:alert(1)')).toBeNull();
        expect(safeUrl('data:text/html,<script>')).toBeNull();
        expect(safeUrl('vbscript:x')).toBeNull();
    });

    it('no renderiza links peligrosos como <a>', () => {
        const html = service.parse('[clic](javascript:alert(1)) y [ok](https://ok.com)');
        expect(html).not.toContain('javascript:');
        expect(html).toContain('href="https://ok.com/"');
        expect(html).toContain('clic');
    });

    it('descarta HTML crudo', () => {
        expect(service.parse('<img src=x onerror=alert(1)>hola')).not.toContain('onerror');
    });

    it('imágenes sólo por https', () => {
        expect(service.parse('![a](http://x.com/a.png)')).not.toContain('<img');
        expect(service.parse('![a](https://x.com/a.png)')).toContain('<img');
    });
});
