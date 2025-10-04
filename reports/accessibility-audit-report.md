# Comprehensive Accessibility Audit Report

**Date**: 2025-10-04
**Total Pages Tested**: 35
**Pages with Violations**: 35
**Total Violations**: 53

## Summary by Impact

| Impact | Count |
|--------|-------|
| Critical | 18 |
| Serious | 35 |
| Moderate | 0 |
| Minor | 0 |

## Summary by Violation Type

| Violation Type | Count | Priority |
|----------------|-------|----------|
| color-contrast | 35 | 🔴 HIGH |
| button-name | 18 | 🔴 HIGH |

## Detailed Violations by Page

### Homepage (/)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<p class="text-xl text-secondary mb-8">Enterprise Management Platform</p>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 15.0pt (20px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Login (/login)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Conta...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Portal Login (/portal/login)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Portal Home (/portal)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Portal Orders (/portal/orders)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Portal Documents (/portal/documents)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### CRM Contacts (/crm/contacts)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">CRM</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### CRM Leads (/crm/leads)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">CRM</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### CRM Customers (/crm/customers)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-6 py-3 rounded-lg f...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.11 (foreground color: #262626, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### CRM Prospects (/crm/prospects)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">CRM</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Orders (/orders)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-6 py-3 rounded-lg f...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.11 (foreground color: #262626, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Invoices (/financials/invoices)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Finance</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Payments (/financials/payments)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Finance</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Quotes (/quotes)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-6 py-3 rounded-lg f...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.11 (foreground color: #262626, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Production Orders (/production/orders)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Conta...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Ordered Items (/production/ordered-items)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Production</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Production Shipments (/production/shipments)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Production</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Quality Inspections (/quality/inspections)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-6 py-3 rounded-lg f...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.11 (foreground color: #262626, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Products Catalog (/products/catalog)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Products</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Collections (/products/collections)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Products</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Concepts (/products/concepts)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Products</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Prototypes (/products/prototypes)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Products</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Projects (/projects)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-6 py-3 rounded-lg f...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.11 (foreground color: #262626, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Tasks (/tasks)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Tasks</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### My Tasks (/tasks/my)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Tasks</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Design Projects (/design/projects)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Conta...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Shop Drawings (/design/shop-drawings)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-6 py-3 rounded-lg f...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.11 (foreground color: #262626, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Design Reviews (/design/reviews)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-6 py-3 rounded-lg f...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.11 (foreground color: #262626, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Factories (/partners/factories)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Partners</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Designers (/partners/designers)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Partners</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Documents (/documents)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Documents</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Communications (/communications)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-6 py-3 rounded-lg f...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.11 (foreground color: #262626, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Shipping (/shipping)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Shipping</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Shipments (/shipping/shipments)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)

**Impact**: CRITICAL

**Description**: Ensure buttons have discernible text

**Affected Elements** (1):

- `<button class="header-icon-button">`
  - **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright](https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright)

---

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<span class="nav-module-label">Shipping</span>`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

### Settings (/settings)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)

**Impact**: SERIOUS

**Description**: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds

**Affected Elements** (1):

- `<a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-6 py-3 rounded-lg f...`
  - **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.11 (foreground color: #262626, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1

**How to Fix**: [https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright](https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright)

---

## Recommended Fixes

### Priority 1: Color Contrast Issues (CRITICAL)

**Found 35 color contrast violations**

**Fix**: Update CSS to meet WCAG AA contrast ratios:

```css
/* BEFORE: Insufficient contrast */
.text-secondary { color: #f1f2f4; } /* 1.12:1 ratio - FAILS */
.bg-blue-500 { background: #3b82f6; color: #262626; } /* 4.11:1 - FAILS */

/* AFTER: WCAG AA compliant */
.text-secondary { color: #6b7280; } /* 4.5:1+ ratio - PASSES */
.bg-blue-500 { background: #3b82f6; color: #ffffff; } /* 4.5:1+ ratio - PASSES */
```

### Priority 2: Form Labels & ARIA

### Priority 3: Heading Hierarchy

### Priority 4: Icon & Button Labels

**Fix**: Add accessible names to icon buttons:

```jsx
// BEFORE: No accessible name
<button><Icon /></button>

// AFTER: Accessible name provided
<button aria-label="Delete item"><Icon /></button>
```

## Action Items

1. **Immediate**: Fix all CRITICAL & SERIOUS violations (53 issues)
2. **Short-term**: Address MODERATE violations (0 issues)
3. **Long-term**: Resolve MINOR violations (0 issues)
4. **Ongoing**: Integrate accessibility testing into CI/CD pipeline
5. **Training**: Educate team on WCAG 2.1 AA compliance requirements

