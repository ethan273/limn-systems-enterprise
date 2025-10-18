# Agent Quick Start Guide

**Get started with AI agents for Limn Systems Enterprise**

---

## 🚀 30-Second Start

1. **Open Claude** (or your AI assistant)
2. **Copy this starter:**
   ```
   I'm working on Limn Systems Enterprise.
   
   Read: /Users/eko3/limn-systems-enterprise/.agents/PROJECT-CONTEXT.md
   Read: /Users/eko3/limn-systems-enterprise/.agents/[AGENT-TYPE].md
   
   Help me: [YOUR TASK]
   ```
3. **Replace [AGENT-TYPE]** with:
   - `code-agent` - Build new features
   - `debug-agent` - Fix bugs
   - `test-agent` - Write/run tests
   - `database-agent` - Database work

---

## 📋 Common Use Cases

### "I need to add a new feature"
```
Read: .agents/PROJECT-CONTEXT.md and .agents/code-agent.md

I need to add a [FEATURE NAME] to the [MODULE] module.
It should allow users to [DESCRIPTION].

Can you:
1. Review similar features in the codebase
2. Design the implementation
3. Generate the code following project patterns
```

### "Something is broken"
```
Read: .agents/PROJECT-CONTEXT.md and .agents/debug-agent.md

I'm getting this error: [ERROR MESSAGE]

It happens when: [DESCRIPTION]

Can you help me find and fix it?
```

### "I need tests for a feature"
```
Read: .agents/PROJECT-CONTEXT.md and .agents/test-agent.md

Write comprehensive E2E tests for: [FEATURE/PAGE]

Cover: happy path, validation, errors, edge cases
```

### "Database changes needed"
```
Read: .agents/PROJECT-CONTEXT.md and .agents/database-agent.md

I need to add [DESCRIPTION] to the database.

Help me:
1. Design the schema
2. Create the migration
3. Update Prisma models
```

---

## 🎯 Best Practices

### DO:
✅ Always reference the project context  
✅ Be specific about what you need  
✅ Ask agent to verify its work  
✅ Request it run type-check/build  
✅ Have it follow project patterns  

### DON'T:
❌ Skip reading context files  
❌ Accept code without verification  
❌ Let agent make assumptions  
❌ Ignore Prime Directive rules  
❌ Skip testing the solution  

---

## 🔄 Typical Workflow

### Phase 1: Planning (5 min)
1. Agent reads context
2. Agent examines similar code
3. Agent proposes approach
4. You review and approve

### Phase 2: Implementation (15-30 min)
1. Agent generates code
2. Agent follows patterns
3. Agent creates tests
4. You review code

### Phase 3: Verification (5-10 min)
1. Agent runs type-check
2. Agent runs build
3. Agent runs tests
4. You test manually

### Phase 4: Integration (5 min)
1. Commit changes
2. Create PR
3. Deploy when ready

---

## 💡 Pro Tips

### Tip 1: Chain Agents
Use different agents in sequence:
1. Database Agent → Create schema
2. Code Agent → Build UI
3. Test Agent → Write tests
4. Debug Agent → Fix issues

### Tip 2: Iterative Refinement
Don't expect perfection first try:
1. Get working version
2. Refine and improve
3. Optimize performance
4. Polish UX

### Tip 3: Verify Everything
After agent makes changes:
```bash
npm run type-check  # Must pass
npm run build       # Must succeed
npm run test:e2e    # Should pass
```

### Tip 4: Keep Context Fresh
If conversation gets long:
- Start new chat
- Re-load project context
- Focus on one task at a time

---

## 📊 Example Complete Workflow

**Task:** Add "Notes" feature to CRM Contacts

**Step 1: Database (Database Agent)**
```
Read context and database-agent.md

Add a "ContactNote" model that belongs to Contact.
Fields: content (text), createdBy (user), createdAt.
Create the migration.
```

**Step 2: API (Code Agent)**
```
Read context and code-agent.md

Create tRPC router for contact notes:
- list notes for a contact
- create note
- delete note
```

**Step 3: UI (Code Agent)**
```
Continue with code-agent

Create UI components:
- NotesList component
- NoteForm component
Add to contact detail page
```

**Step 4: Tests (Test Agent)**
```
Read context and test-agent.md

Write E2E tests for contact notes:
- Add note
- View notes
- Delete note
- Validation errors
```

**Step 5: Debug (Debug Agent if needed)**
```
Read context and debug-agent.md

Getting this error when creating notes: [ERROR]
Help me fix it.
```

---

## 🆘 When Things Go Wrong

**Agent generates incorrect code:**
→ Point out the issue, reference correct examples
→ Ask it to review similar working code
→ Be more specific in your requirements

**Type errors after changes:**
→ Use Debug Agent with type-check output
→ Have it fix one error at a time
→ Regenerate Prisma client if DB changes

**Tests failing:**
→ Use Test Agent to debug
→ Check test output carefully
→ Verify test data/fixtures

**Still stuck:**
→ Run `./scripts/pre-deploy-check.sh`
→ Review `.claude/claude.md` standards
→ Check README.md documentation

---

## 📚 Available Templates

Located in `/Users/eko3/limn-systems-enterprise/.agents/`:

- `PROJECT-CONTEXT.md` - Always read first
- `code-agent.md` - Feature development
- `debug-agent.md` - Bug fixing
- `test-agent.md` - Testing
- `database-agent.md` - Database work
- `README.md` - This guide

---

## 🎓 Learning Resources

**Understand the codebase:**
- Read `README.md` in project root
- Review `.claude/claude.md` Prime Directive
- Browse `src/app/` for page structure
- Check `src/server/routers/` for API patterns

**Example code to study:**
- `src/components/crm/` - Component patterns
- `src/server/routers/crm.ts` - tRPC patterns
- `tests/30-crm-*.spec.ts` - Test patterns
- `prisma/schema.prisma` - Database models

---

**Ready to start? Pick an agent template and go! 🚀**
