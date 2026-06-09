# Contributing to Inventory Distribution System

Thank you for your interest in contributing! This guide will help you get started.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)

---

## 🤝 Code of Conduct

Be respectful, inclusive, and professional. We want to foster a welcoming community.

---

## 🚀 Getting Started

### 1. Fork & Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/inventory-distribution-system-FE.git
cd inventory-distribution-system-FE

# Add upstream remote
git remote add upstream https://github.com/MeladAdera/inventory-distribution-system-FE.git
```

### 2. Create Feature Branch

```bash
# Update main branch
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 3. Install & Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

---

## 💻 Development Workflow

### While Developing

1. **Keep your branch updated**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests & checks**
   ```bash
   npm run lint      # ESLint
   npm run format    # Prettier
   npm run build     # Test build
   ```

3. **Test locally**
   ```bash
   npm run dev
   # Test in browser at http://localhost:3000
   ```

4. **Commit frequently**
   ```bash
   git add src/...
   git commit -m "feat: your clear commit message"
   ```

### Before Pushing

```bash
# Make sure everything passes
npm run lint          # Must pass
npm run format:check  # Must pass
npm run build         # Must succeed
npm run dev           # Manual testing
```

---

## 📐 Coding Standards

### TypeScript

- ✅ **Strict Mode Required**
  ```typescript
  // Good
  const name: string = "John";
  const age: number = 25;
  
  // Avoid
  const name: any = "John";
  const age = 25 as any;
  ```

- ✅ **No `any` Types**
  ```typescript
  // Good
  interface User {
    id: string;
    name: string;
  }
  
  // Avoid
  const user: any = {...};
  ```

- ✅ **Clear Variable Names**
  ```typescript
  // Good
  const userCount: number = 10;
  const isAuthenticated: boolean = true;
  
  // Avoid
  const uc = 10;
  const auth = true;
  ```

### React Components

- ✅ **Functional Components Only**
  ```typescript
  // Good
  export function UserCard({ user }: Props) {
    return <div>{user.name}</div>;
  }
  
  // Avoid
  class UserCard extends React.Component {...}
  ```

- ✅ **Use Hooks**
  ```typescript
  // Good
  const { user } = useAuth();
  const { data } = useQuery({...});
  
  // Avoid - Don't use class components
  ```

- ✅ **Proper Component Structure**
  ```typescript
  export interface UserCardProps {
    user: User;
    onSelect: (id: string) => void;
  }

  export function UserCard({ user, onSelect }: UserCardProps) {
    return (
      <div onClick={() => onSelect(user.id)}>
        {user.name}
      </div>
    );
  }
  ```

### Imports

- ✅ **Absolute Imports with Aliases**
  ```typescript
  // Good
  import { Button } from '@/common/components';
  import { useAuth } from '@/features/auth';
  import { cn } from '@/common/utils/cn';
  
  // Avoid relative imports
  import { Button } from '../../../common/components';
  ```

- ✅ **Organize Imports**
  ```typescript
  // 1. External libraries
  import React from 'react';
  import { useQuery } from '@tanstack/react-query';
  
  // 2. Internal absolute imports
  import { Button } from '@/common/components';
  import { useAuth } from '@/features/auth';
  
  // 3. Type imports
  import type { User } from '@/features/auth/types/auth.types';
  ```

### Comments

- ✅ **Only When Necessary**
  ```typescript
  // Good - Explains WHY, not WHAT
  const users = await fetchUsers();
  // Cache for 5 minutes to reduce API calls
  
  // Avoid - Explains obvious code
  // This increments i
  i++;
  ```

- ✅ **JSDoc for Functions**
  ```typescript
  /**
   * Fetches users with pagination
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default: 10)
   * @returns Promise containing users and pagination info
   */
  export async function fetchUsers(page: number, limit = 10) {
    // Implementation
  }
  ```

---

## 📝 Commit Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (no logic change)
- `refactor`: Refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Dependencies, config

### Scope

- `auth` - Authentication feature
- `inventory` - Inventory feature
- `orders` - Orders feature
- `products` - Products feature
- `common` - Common utilities
- `ui` - UI components
- `api` - API client

### Subject

- Imperative mood ("add" not "added")
- No period at end
- Under 50 characters

### Body

- Explain WHAT and WHY, not HOW
- Wrap at 72 characters
- Separate from subject with blank line

### Examples

```
feat(auth): implement login page

Add login page with email/password validation.
Integrate with auth API for credential verification.
Implement error handling and loading states.

Closes #123
```

```
fix(common): correct usePermission hook logic

The hook was checking role incorrectly, always returning true.
Updated to properly compare user role with required role.

Related: docs/features/auth.md
```

```
docs: update installation instructions

Added Node.js version requirement (18+).
Clarified environment variable setup.
```

---

## 🔄 Pull Request Process

### 1. Create PR

```bash
git push origin feature/your-feature-name
# Open PR on GitHub
```

### 2. PR Title & Description

**Title Format**: `[Type] Brief description`

**Description Template**:
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Performance improvement

## Related Issue
Closes #123

## Checklist
- [ ] Code follows style guidelines
- [ ] ESLint passes
- [ ] TypeScript strict mode passes
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console warnings/errors
- [ ] Changes are backward compatible

## Screenshots (if applicable)
[Add screenshots here]

## Testing
Describe testing approach:
1. Step 1
2. Step 2
3. Expected result
```

### 3. Review Process

- [ ] At least one approval required
- [ ] All CI checks pass
- [ ] No conflicts with main
- [ ] Documentation updated

### 4. Merge

```bash
# Merge using GitHub UI
# Delete feature branch after merge
```

---

## 📚 Documentation

### When to Document

- [ ] New feature
- [ ] API change
- [ ] Configuration option
- [ ] Architecture decision
- [ ] Bug fix (if significant)

### Documentation Checklist

- [ ] Feature doc created/updated
- [ ] Code comments added
- [ ] README updated (if applicable)
- [ ] PROGRESS.md updated
- [ ] PROJECT_STATUS.md updated
- [ ] Example added (if applicable)

### Using the Feature Template

```bash
# Copy template for new feature
cp docs/features/FEATURE_TEMPLATE.md docs/features/your-feature.md

# Fill in the template
# - Overview
# - Requirements
# - Implementation details
# - Testing section
# - Known issues
```

---

## ✅ Pre-Commit Checklist

Before committing code:

```bash
# 1. Format code
npm run format

# 2. Run linter
npm run lint

# 3. Type check
npm run build

# 4. Manual testing
npm run dev
# Test in browser

# 5. Commit
git add src/...
git commit -m "type(scope): message"
```

---

## 🚨 Common Issues

### Issue: Merge Conflicts

```bash
# Resolve conflicts
git fetch upstream
git rebase upstream/main
# Fix conflicts in editor
git add .
git rebase --continue
git push --force-with-lease origin feature/your-feature-name
```

### Issue: Accidentally Committed to Main

```bash
git reset HEAD~1
git stash
git checkout -b feature/your-feature-name
git stash pop
git commit -m "..."
```

### Issue: Build Failing

```bash
# Clear cache
rm -rf .next
npm run build

# If TypeScript error
npm run lint --fix

# If still failing, check:
# - Environment variables
# - Dependencies (npm install)
# - Node version (18+)
```

---

## 🎯 What We're Looking For

### Code Quality
- ✅ TypeScript strict mode compliant
- ✅ No ESLint warnings/errors
- ✅ Formatted with Prettier
- ✅ Clear, readable code
- ✅ Proper error handling

### Documentation
- ✅ Code comments for complex logic
- ✅ Updated README (if applicable)
- ✅ Clear commit messages
- ✅ Feature documentation
- ✅ Examples provided

### Testing
- ✅ Manual testing documented
- ✅ Edge cases considered
- ✅ Error scenarios tested
- ✅ No console errors

### Best Practices
- ✅ Follows project conventions
- ✅ Modular and reusable
- ✅ Performance considered
- ✅ Accessibility considered
- ✅ Backward compatible

---

## 📞 Need Help?

- Check existing documentation in `docs/`
- Review similar code in the codebase
- Open an issue for questions
- Contact: meladhih@gmail.com

---

## 🙏 Thank You!

Your contributions make this project better. We appreciate your effort!

---

**Last Updated**: June 9, 2026  
**Maintained By**: Melad Adera
