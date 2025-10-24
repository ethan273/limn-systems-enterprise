# Pull Request

## Description

<!-- Provide a clear, concise summary of changes (1-3 paragraphs) -->
<!-- Include: what changed, why it changed, business context -->

### What Changed


### Why


### How (Technical Approach)


---

## Type of Change

<!-- Select ALL that apply by placing an 'x' in the brackets -->

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (code improvement without behavior change)
- [ ] Performance improvement
- [ ] Security fix
- [ ] Dependency update

---

## Testing

### Automated Tests

<!-- Describe new/updated tests -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing: `npm run test:run`
- [ ] Type check passing: `npm run type-check`
- [ ] Lint passing: `npm run lint`
- [ ] Build successful: `npm run build`

**Test Coverage**: <!-- e.g., Added 12 unit tests, coverage maintained at 85% -->

### Manual Testing

<!-- Describe manual testing performed -->

**Scenarios Tested**:
- [ ] Happy path
- [ ] Edge cases
- [ ] Error handling
- [ ] Responsive design (if UI change)
- [ ] Cross-browser (if UI change)
- [ ] Light/dark theme (if UI change)

**Testing Details**:
<!-- Example: Tested with 10, 100, 1000 record datasets; verified error messages; tested on Chrome, Firefox, Safari -->

---

## Checklist

### Code Quality

- [ ] Code follows project standards (see Prime Directive: `.claude/CLAUDE.md`)
- [ ] Self-review completed
- [ ] No `console.log` statements (except intentional debugging)
- [ ] No commented-out code blocks (>10 lines)
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Code is self-documenting (clear names, explanatory comments)

### Standards Compliance

<!-- Check applicable standards -->

- [ ] **Auth Pattern Standard**: Uses `api.userProfile.getCurrentUser.useQuery()` (NOT `useAuthContext`)
- [ ] **Database Access Pattern**: Uses Prisma with proper filters and includes
- [ ] **Logo Usage Pattern**: Correct logo for theme (if applicable)
- [ ] **Error Handling Standards**: Proper error handling and user-friendly messages
- [ ] **Feature Flags**: New features behind flags (if applicable)

### Security

- [ ] **No secrets exposed** (API keys, tokens, passwords)
- [ ] **No secrets in .env.example** (only placeholders)
- [ ] Input validation present (Zod schemas)
- [ ] Authentication/authorization checks correct
- [ ] Security audit passed: `npm run security:check`

### Documentation

- [ ] Code comments for complex logic
- [ ] README/docs updated (if needed)
- [ ] API documentation updated (if API changes)
- [ ] CHANGELOG updated (for significant changes)
- [ ] Environment variables documented in `.env.example` (if new vars)

### Build & Deployment

- [ ] Build succeeds without errors
- [ ] No breaking changes (or documented with migration guide)
- [ ] Database migrations included (if schema changes)
- [ ] Rollback plan considered (if high-risk change)

---

## Screenshots / Videos

<!-- Required for UI changes -->
<!-- Include before/after comparison if fixing visual issue -->
<!-- Include multiple viewports (desktop, tablet, mobile) if responsive design change -->
<!-- Include light and dark theme if theme-dependent -->

### Desktop View


### Mobile View


### Demo Video

<!-- Link to video demonstrating feature/fix -->

---

## Related Issues

<!-- Link related issues using keywords to auto-close -->
<!-- Closes #123 | Fixes #456 | Resolves #789 -->
<!-- Relates to #234 (for issues that don't close) -->

Closes #

---

## Additional Context

<!-- Any additional information that reviewers should know -->
<!-- Known limitations, follow-up work needed, deployment notes, etc. -->

### Known Limitations


### Follow-up Work

<!-- Link to follow-up issues if applicable -->

---

## Reviewer Notes

<!-- Specific areas you want reviewers to focus on -->
<!-- Questions for reviewers -->
<!-- Performance considerations -->

---

<!--
📚 Documentation: /limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PR-TEMPLATE.md
✅ Code Review Checklist: /limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/CODE-REVIEW-CHECKLIST.md
🎯 Prime Directive: /limn-systems-enterprise/.claude/CLAUDE.md
-->
