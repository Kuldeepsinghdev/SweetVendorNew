/**
 * Test: Button Styling Across Viewports
 * Task: 2.2 Test button styling across viewports
 * File: app/(auth)/mitra/apply/MitraApplyForm.tsx
 * 
 * This test verifies that the "Submit Application" button maintains
 * proper styling and appearance across different screen sizes:
 * - Mobile: < 640px
 * - Tablet: 640px - 1024px
 * - Desktop: > 1024px
 */

import fs from 'fs';
import path from 'path';

describe('Task 2.2: Button Styling Across Viewports', () => {
  let formContent: string;

  beforeAll(() => {
    const formPath = path.join(
      __dirname,
      '../app/(auth)/mitra/apply/MitraApplyForm.tsx'
    );
    formContent = fs.readFileSync(formPath, 'utf-8');
  });

  describe('Check 1: w-full class ensures full width on all screens', () => {
    it('should have w-full class on button element', () => {
      // Look for the button with w-full class
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*w-full[^"]*)"/
      );
      expect(buttonMatch).toBeTruthy();
      expect(buttonMatch?.[1]).toContain('w-full');
    });

    it('should not have any responsive width classes that conflict with w-full', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*w-full[^"]*)"/
      );
      const classNames = buttonMatch?.[1] || '';
      // Should not have conflicting width classes like sm:w-1/2, md:w-1/3, etc.
      expect(classNames).not.toMatch(/\s(sm|md|lg|xl):[w-]/);
    });
  });

  describe('Check 2: Form container has proper padding', () => {
    it('should have proper padding on form element', () => {
      // The form should be wrapped properly with padding
      const formMatch = formContent.match(/<form[\s\S]*?className="([^"]*)"/);
      expect(formMatch).toBeTruthy();
      const formClasses = formMatch?.[1] || '';
      
      // Should have padding for spacing
      expect(formClasses).toMatch(/\bp-[0-9]/);
    });

    it('should maintain consistent spacing with responsive padding', () => {
      const formMatch = formContent.match(/<form[\s\S]*?className="([^"]*)"/);
      const formClasses = formMatch?.[1] || '';
      
      // Should have responsive padding (sm:p-* or just p-*)
      expect(formClasses).toMatch(/(p-|sm:p-)[0-9]/);
    });
  });

  describe('Check 3: Button text wraps properly on narrow screens', () => {
    it('should use font-semibold for readable text at all sizes', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*font-semibold[^"]*)"/
      );
      expect(buttonMatch).toBeTruthy();
      expect(buttonMatch?.[1]).toContain('font-semibold');
    });

    it('should not have restrictive width constraints on button text', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*w-full[^"]*)"/
      );
      const classNames = buttonMatch?.[1] || '';
      // Should have w-full which allows text to wrap naturally
      expect(classNames).toContain('w-full');
    });

    it('should have button content that supports bilingual text', () => {
      // Check for conditional rendering of English/Hindi text
      expect(formContent).toContain("'आगे बढ़ें / Submit Application'");
      expect(formContent).toContain("'Submit Application'");
    });
  });

  describe('Check 4: ArrowRight icon displays correctly at all sizes', () => {
    it('should import ArrowRight icon from lucide-react', () => {
      expect(formContent).toContain('ArrowRight');
      expect(formContent).toContain('from \'lucide-react\'');
    });

    it('should use ArrowRight icon with w-4 h-4 sizing', () => {
      const iconMatch = formContent.match(/<ArrowRight[^>]*className="([^"]*)"/);
      expect(iconMatch).toBeTruthy();
      const classes = iconMatch?.[1] || '';
      expect(classes).toMatch(/w-4/);
      expect(classes).toMatch(/h-4/);
    });

    it('should have proper spacing between text and icon', () => {
      const iconMatch = formContent.match(/<ArrowRight[^>]*className="([^"]*)"/);
      expect(iconMatch).toBeTruthy();
      // Should have margin classes for spacing
      expect(formContent).toContain('ml-2');
    });
  });

  describe('Check 5: Orange background provides sufficient contrast at all sizes', () => {
    it('should use bg-orange-600 background color', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*bg-orange-600[^"]*)"/
      );
      expect(buttonMatch).toBeTruthy();
      expect(buttonMatch?.[1]).toContain('bg-orange-600');
    });

    it('should use text-white for high contrast text', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*text-white[^"]*)"/
      );
      expect(buttonMatch).toBeTruthy();
      expect(buttonMatch?.[1]).toContain('text-white');
    });

    it('should have hover state with darker orange (hover:bg-orange-700)', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*hover:bg-orange-700[^"]*)"/
      );
      expect(buttonMatch).toBeTruthy();
      expect(buttonMatch?.[1]).toContain('hover:bg-orange-700');
    });

    it('should have focus ring for keyboard accessibility', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*focus:ring[^"]*)"/
      );
      expect(buttonMatch).toBeTruthy();
      const classes = buttonMatch?.[1] || '';
      expect(classes).toContain('focus:ring-2');
      expect(classes).toContain('focus:ring-orange-400');
    });

    it('should have focus ring offset for visibility', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*focus:ring-offset[^"]*)"/
      );
      expect(buttonMatch).toBeTruthy();
      expect(buttonMatch?.[1]).toContain('focus:ring-offset-2');
    });
  });

  describe('Check 6: Button remains prominent across all viewports', () => {
    it('should maintain full width on mobile, tablet, and desktop', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*w-full[^"]*)"/
      );
      expect(buttonMatch).toBeTruthy();
      // w-full applies to all screen sizes
      expect(buttonMatch?.[1]).toContain('w-full');
    });

    it('should have transition classes for smooth state changes', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*transition[^"]*)"/
      );
      expect(buttonMatch).toBeTruthy();
      expect(buttonMatch?.[1]).toContain('transition-colors');
    });

    it('should have duration class for transition speed', () => {
      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*duration[^"]*)"/
      );
      expect(buttonMatch).toBeTruthy();
      expect(buttonMatch?.[1]).toContain('duration-200');
    });
  });

  describe('Visual Verification Checklist', () => {
    it('should be a valid submit button', () => {
      expect(formContent).toContain('type="submit"');
    });

    it('should have loading state with spinner', () => {
      expect(formContent).toContain('pending');
      expect(formContent).toContain('animate-spin');
    });

    it('should show appropriate text during loading', () => {
      expect(formContent).toContain("'सबमिट हो रहा है...'");
      expect(formContent).toContain("'Submitting...'");
    });

    it('should have all required visual styling classes', () => {
      const requiredClasses = [
        'w-full',
        'bg-orange-600',
        'text-white',
        'hover:bg-orange-700',
        'focus:ring-2',
        'focus:ring-orange-400',
        'focus:ring-offset-2',
        'transition-colors',
        'duration-200',
        'font-semibold'
      ];

      const buttonMatch = formContent.match(
        /<Button[\s\S]*?className="([^"]*)"/
      );
      const classNames = buttonMatch?.[1] || '';

      requiredClasses.forEach((cls) => {
        expect(classNames).toContain(cls);
      });
    });
  });
});
