# COMPLETE Accessibility Audit - Light & Dark Modes

**Date**: 2025-10-04
**Total Pages**: 103
**Total Tests**: 206 (103 × light mode + 103 × dark mode)

## 📊 Summary

### Light Mode
- **Pages Tested**: 103
- **Pages with Violations**: 98
- **Pages Clean**: 5
- **Total Violations**: 305

### Dark Mode
- **Pages Tested**: 103
- **Pages with Violations**: 87
- **Pages Clean**: 16
- **Total Violations**: 273

---

## 🌞 LIGHT MODE VIOLATIONS

### Homepage (/)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-xl text-secondary mb-8">Enterprise Management Platform</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 15.0pt (20px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-8 py-3 rounded-lg font-medium transition-colors" href="/dashboard">Go to Dashb`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.11 (foreground color: #262626, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Login (/login)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Dashboard (/dashboard)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Dashboards</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Main Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Terms of Service (/terms)

**Total Violations**: 1

#### Scrollable region must have keyboard access (scrollable-region-focusable)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="light">`
- **Issue**: Fix any of the following:
  Element should have focusable content
  Element should be focusable
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable?application=playwright


---

### Auth - Employee (/auth/employee)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a class="inline-flex items-center text-sm text-secondary hover:text-primary mb-6" href="/login">`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary mt-2">Sign in with your @limn.us.com Google account</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Auth - Customer (/auth/customer)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a class="inline-flex items-center text-sm text-secondary hover:text-primary mb-6" href="/login">`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary mt-2">Coming Soon</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Auth - Contractor (/auth/contractor)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a class="inline-flex items-center text-sm text-secondary hover:text-primary mb-6" href="/login">`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary mt-2">Coming Soon</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Auth - Dev (/auth/dev)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a class="inline-flex items-center text-sm text-secondary hover:text-primary mb-6" href="/login">`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary mt-2">Testing &amp; Development Only</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Analytics Dashboard (/dashboards/analytics)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary">Analytics dashboard coming soon...</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Executive Dashboard (/dashboards/executive)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary">Executive dashboard coming soon...</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Projects Dashboard (/dashboards/projects)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary">Project dashboard coming soon...</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Home (/crm)

**Total Violations**: 3

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary">CRM dashboard coming soon...</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Clients (/crm/clients)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Clients</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Contacts (/crm/contacts)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Contacts</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Contact Detail (/crm/contacts/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Contacts</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Customers Detail (/crm/customers/123)

**Total Violations**: 2

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright


---

### CRM Leads (/crm/leads)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Leads</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Lead Detail (/crm/leads/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Leads</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Orders (/crm/orders)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Projects (/crm/projects)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Projects</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Prospects (/crm/prospects)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prospects</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Prospect Detail (/crm/prospects/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prospects</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Design Boards (/design/boards)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Documents must have <title> element to aid in navigation (document-title)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="light" style="">`
- **Issue**: Fix any of the following:
  Document does not have a non-empty <title> element
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/document-title?application=playwright


---

### Design Board Detail (/design/boards/123)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Documents must have <title> element to aid in navigation (document-title)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="light" style="">`
- **Issue**: Fix any of the following:
  Document does not have a non-empty <title> element
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/document-title?application=playwright


---

### Design Briefs (/design/briefs)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Documents must have <title> element to aid in navigation (document-title)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="light" style="">`
- **Issue**: Fix any of the following:
  Document does not have a non-empty <title> element
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/document-title?application=playwright


---

### Design Brief Detail (/design/briefs/123)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Design Brief New (/design/briefs/new)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Documents must have <title> element to aid in navigation (document-title)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="light" style="">`
- **Issue**: Fix any of the following:
  Document does not have a non-empty <title> element
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/document-title?application=playwright


---

### Design Documents (/design/documents)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Documents must have <title> element to aid in navigation (document-title)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="light" style="">`
- **Issue**: Fix any of the following:
  Document does not have a non-empty <title> element
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/document-title?application=playwright


---

### Design Projects (/design/projects)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Design Project Detail (/design/projects/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Design</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Design Projects</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Documents List (/documents)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Documents</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Documents</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Document Detail (/documents/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Documents</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Documents</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Finance Home (/finance)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Invoices (/financials/invoices)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Finance</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Invoices</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Invoice Detail (/financials/invoices/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Finance</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Invoices</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Payments (/financials/payments)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Finance</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Payments</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Payment Detail (/financials/payments/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Finance</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Payments</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designers (/partners/designers)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Partners</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Designers</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Detail (/partners/designers/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Partners</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Designers</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factories (/partners/factories)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Partners</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Factories</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Detail (/partners/factories/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Partners</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Factories</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Home (/portal)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Login (/portal/login)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Documents (/portal/documents)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Orders (/portal/orders)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Order Detail (/portal/orders/123)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Financials (/portal/financials)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Shipping (/portal/shipping)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Portal Home (/portal/designer)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Portal Documents (/portal/designer/documents)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Portal Project (/portal/designer/projects/123)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Portal Quality (/portal/designer/quality)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Portal Settings (/portal/designer/settings)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Portal Home (/portal/factory)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Portal Documents (/portal/factory/documents)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Portal Order (/portal/factory/orders/123)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Portal Quality (/portal/factory/quality)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Portal Settings (/portal/factory/settings)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="/portal/forgot-password" class="text-[#91bdbd] hover:underline">Forgot your password?</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-[#91bdbd] hover:underline">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.05 (foreground color: #91bdbd, background color: #ffffff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Dashboard (/production/dashboard)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Factory Reviews (/production/factory-reviews)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Factory Reviews</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Factory Review Detail (/production/factory-reviews/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Factory Reviews</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Ordered Items (/production/ordered-items)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Ordered Items</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Orders (/production/orders)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a href="mailto:support@limnsystems.com" class="text-blue-400 hover:text-blue-300 font-medium">Contact Support</a>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.54 (foreground color: #60a5fa, background color: #ffffff, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Documents must have <title> element to aid in navigation (document-title)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="light" style="">`
- **Issue**: Fix any of the following:
  Document does not have a non-empty <title> element
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/document-title?application=playwright


---

### Production Order Detail (/production/orders/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Production Orders</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Packing (/production/packing)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Packing &amp; Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Packing Detail (/production/packing/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Packing &amp; Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Prototypes (/production/prototypes)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prototypes</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Prototype Detail (/production/prototypes/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prototypes</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Prototype New (/production/prototypes/new)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prototypes</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production QC (/production/qc)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>QC Inspections</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production QC Detail (/production/qc/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>QC Inspections</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Shipments (/production/shipments)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Shipments</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Shop Drawings (/production/shop-drawings)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Shop Drawings</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Shop Drawing Detail (/production/shop-drawings/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Shop Drawings</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Shop Drawing New (/production/shop-drawings/new)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Shop Drawings</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Products Catalog (/products/catalog)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Catalog</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Product Detail (/products/catalog/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Catalog</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Collections (/products/collections)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Collections</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Collection Detail (/products/collections/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Collections</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Concepts (/products/concepts)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Concepts</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Concept Detail (/products/concepts/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Concepts</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Materials (/products/materials)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Materials</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Product Ordered Items (/products/ordered-items)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Ordered</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Prototypes (/products/prototypes)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prototypes</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Prototype Detail (/products/prototypes/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prototypes</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Shipping Home (/shipping)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Shipments (/shipping/shipments)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Shipment Detail (/shipping/shipments/123)

**Total Violations**: 3

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Shipping Tracking (/shipping/tracking)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Track Shipment (/shipping/tracking/TRACK123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Tasks List (/tasks)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Task Detail (/tasks/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### My Tasks (/tasks/my)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Client Tasks (/tasks/client)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Tasks (/tasks/designer)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Manufacturer Tasks (/tasks/manufacturer)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Task Kanban (/tasks/kanban)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Task Templates (/tasks/templates)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.49 (foreground color: #2463eb, background color: #e9effd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---


## 🌙 DARK MODE VIOLATIONS

### Homepage (/)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-xl text-secondary mb-8">Enterprise Management Platform</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.35 (foreground color: #29313d, background color: #15181e, font size: 15.0pt (20px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a class="inline-block bg-blue-500 hover:bg-blue-600 text-foreground px-8 py-3 rounded-lg font-medium transition-colors" href="/dashboard">Go to Dashb`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 2.95 (foreground color: #e1e7ef, background color: #3b82f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Dashboard (/dashboard)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Dashboards</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Main Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Terms of Service (/terms)

**Total Violations**: 1

#### Scrollable region must have keyboard access (scrollable-region-focusable)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="dark">`
- **Issue**: Fix any of the following:
  Element should have focusable content
  Element should be focusable
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable?application=playwright


---

### Auth - Employee (/auth/employee)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a class="inline-flex items-center text-sm text-secondary hover:text-primary mb-6" href="/login">`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.28 (foreground color: #29313d, background color: #191d24, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary mt-2">Sign in with your @limn.us.com Google account</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.28 (foreground color: #29313d, background color: #191d24, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Auth - Customer (/auth/customer)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a class="inline-flex items-center text-sm text-secondary hover:text-primary mb-6" href="/login">`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.28 (foreground color: #29313d, background color: #191d24, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary mt-2">Coming Soon</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.28 (foreground color: #29313d, background color: #191d24, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Auth - Contractor (/auth/contractor)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a class="inline-flex items-center text-sm text-secondary hover:text-primary mb-6" href="/login">`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.28 (foreground color: #29313d, background color: #191d24, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary mt-2">Coming Soon</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.28 (foreground color: #29313d, background color: #191d24, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Auth - Dev (/auth/dev)

**Total Violations**: 2

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<a class="inline-flex items-center text-sm text-secondary hover:text-primary mb-6" href="/login">`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.28 (foreground color: #29313d, background color: #191d24, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary mt-2">Testing &amp; Development Only</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.28 (foreground color: #29313d, background color: #191d24, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Analytics Dashboard (/dashboards/analytics)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary">Analytics dashboard coming soon...</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.31 (foreground color: #29313d, background color: #171b21, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Executive Dashboard (/dashboards/executive)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary">Executive dashboard coming soon...</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.31 (foreground color: #29313d, background color: #171b21, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Projects Dashboard (/dashboards/projects)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary">Project dashboard coming soon...</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.31 (foreground color: #29313d, background color: #171b21, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Home (/crm)

**Total Violations**: 3

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary">CRM dashboard coming soon...</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.31 (foreground color: #29313d, background color: #171b21, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Clients (/crm/clients)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Clients</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Contacts (/crm/contacts)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Contacts</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Contact Detail (/crm/contacts/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Contacts</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Customers Detail (/crm/customers/123)

**Total Violations**: 3

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 3.34 (foreground color: #ffffff, background color: #338bff, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Leads (/crm/leads)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Leads</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Lead Detail (/crm/leads/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Leads</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Projects (/crm/projects)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Projects</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Prospects (/crm/prospects)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prospects</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### CRM Prospect Detail (/crm/prospects/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">CRM</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prospects</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Design Boards (/design/boards)

**Total Violations**: 1

#### Documents must have <title> element to aid in navigation (document-title)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="dark" style="">`
- **Issue**: Fix any of the following:
  Document does not have a non-empty <title> element
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/document-title?application=playwright


---

### Design Board Detail (/design/boards/123)

**Total Violations**: 1

#### Documents must have <title> element to aid in navigation (document-title)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="dark" style="">`
- **Issue**: Fix any of the following:
  Document does not have a non-empty <title> element
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/document-title?application=playwright


---

### Design Briefs (/design/briefs)

**Total Violations**: 1

#### Documents must have <title> element to aid in navigation (document-title)
- **Impact**: SERIOUS
- **Element**: `<html lang="en" class="dark" style="">`
- **Issue**: Fix any of the following:
  Document does not have a non-empty <title> element
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/document-title?application=playwright


---

### Design Brief Detail (/design/briefs/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Design</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Design Briefs</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Documents List (/documents)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Documents</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Documents</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Document Detail (/documents/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Documents</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Documents</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Finance Home (/finance)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Finance</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Invoices (/financials/invoices)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Finance</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Invoices</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Invoice Detail (/financials/invoices/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Finance</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Invoices</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Payments (/financials/payments)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Finance</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Payments</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Payment Detail (/financials/payments/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Finance</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Payments</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designers (/partners/designers)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Partners</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Designers</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Detail (/partners/designers/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Partners</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Designers</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factories (/partners/factories)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Partners</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Factories</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Detail (/partners/factories/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Partners</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Factories</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Login (/portal/login)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Orders (/portal/orders)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Order Detail (/portal/orders/123)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Financials (/portal/financials)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Portal Shipping (/portal/shipping)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<p class="text-secondary">Loading portal...</p>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.12 (foreground color: #f1f2f4, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Portal Home (/portal/designer)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Portal Documents (/portal/designer/documents)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Portal Project (/portal/designer/projects/123)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Portal Quality (/portal/designer/quality)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Portal Settings (/portal/designer/settings)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Portal Home (/portal/factory)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Portal Documents (/portal/factory/documents)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Portal Quality (/portal/factory/quality)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Factory Portal Settings (/portal/factory/settings)

**Total Violations**: 1

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 1.65 (foreground color: #e1e7ef, background color: #91bdbd, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Dashboard (/production/dashboard)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Factory Reviews (/production/factory-reviews)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Factory Reviews</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Factory Review Detail (/production/factory-reviews/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Factory Reviews</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Ordered Items (/production/ordered-items)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Ordered Items</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Packing (/production/packing)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Packing &amp; Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Packing Detail (/production/packing/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Packing &amp; Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Prototypes (/production/prototypes)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prototypes</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Prototype Detail (/production/prototypes/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prototypes</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Prototype New (/production/prototypes/new)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prototypes</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production QC (/production/qc)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>QC Inspections</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production QC Detail (/production/qc/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>QC Inspections</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Shipments (/production/shipments)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Shipments</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Shop Drawings (/production/shop-drawings)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Shop Drawings</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Shop Drawing Detail (/production/shop-drawings/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Shop Drawings</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Production Shop Drawing New (/production/shop-drawings/new)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Production</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Shop Drawings</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Products Catalog (/products/catalog)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Catalog</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Product Detail (/products/catalog/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Catalog</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Collections (/products/collections)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Collections</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Collection Detail (/products/collections/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Collections</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Concepts (/products/concepts)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Concepts</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Concept Detail (/products/concepts/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Concepts</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Materials (/products/materials)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Materials</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Product Ordered Items (/products/ordered-items)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Ordered</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Prototypes (/products/prototypes)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prototypes</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Prototype Detail (/products/prototypes/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Products</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Prototypes</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Shipping Home (/shipping)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Shipments (/shipping/shipments)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Shipment Detail (/shipping/shipments/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Shipping Tracking (/shipping/tracking)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Track Shipment (/shipping/tracking/TRACK123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Shipping</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>Dashboard</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Tasks List (/tasks)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Task Detail (/tasks/123)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### My Tasks (/tasks/my)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Client Tasks (/tasks/client)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Designer Tasks (/tasks/designer)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Manufacturer Tasks (/tasks/manufacturer)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Task Kanban (/tasks/kanban)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---

### Task Templates (/tasks/templates)

**Total Violations**: 4

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Buttons must have discernible text (button-name)
- **Impact**: CRITICAL
- **Element**: `<button class="header-icon-button">`
- **Issue**: Fix any of the following:
  Element does not have inner text that is visible to screen readers
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element does not have an implicit (wrapped) <label>
  Element does not have an explicit <label>
  Element's default semantics were not overridden with role="none" or role="presentation"
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/button-name?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span class="nav-module-label">Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright

#### Elements must meet minimum color contrast ratio thresholds (color-contrast)
- **Impact**: SERIOUS
- **Element**: `<span>All Tasks</span>`
- **Issue**: Fix any of the following:
  Element has insufficient color contrast of 4.43 (foreground color: #338bff, background color: #1c283a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1
- **Fix**: https://dequeuniversity.com/rules/axe/4.10/color-contrast?application=playwright


---


## 🎯 Recommended Fixes

### Critical Issues to Address:

1. **Color Contrast** - Most common violation in both modes
   - Light mode: Check foreground/background color combinations
   - Dark mode: Verify dark background colors meet contrast ratios

2. **Icon Buttons** - Missing aria-labels
   - Add descriptive aria-label to all icon-only buttons
   - Example: `<button aria-label="Open menu"><IconComponent /></button>`

3. **Mode-Specific Issues**:
   - Light mode: Links and secondary text colors
   - Dark mode: Ensure all colors are properly inverted and still accessible

### Next Steps:
1. Fix all CRITICAL violations first
2. Then address SERIOUS violations
3. Verify fixes in both light and dark modes
4. Re-run audit to confirm 0 violations
