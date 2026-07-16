const fs = require('fs');
const path = require('path');

const base = path.resolve('resources/js');

// Fix AuthenticatedLayout to accept 'title' prop
function fixAuthenticatedLayout() {
  const p = path.join(base, 'Layouts', 'AuthenticatedLayout.tsx');
  let content = fs.readFileSync(p, 'utf8');
  
  // Add title to interface
  content = content.replace(
    'interface AuthenticatedProps {\n  user?: User;\n  header?: ReactNode;\n  children: ReactNode;\n}',
    `interface AuthenticatedProps {
  user?: User;
  header?: ReactNode;
  title?: string;
  children: ReactNode;
  [key: string]: any; // Allow extra props from old wrappers
}`
  );
  
  // Use title if header not provided
  content = content.replace(
    "const title = typeof header === 'string' ? header : (header as any)?.props?.children ?? 'Dashboard';",
    `  const resolvedTitle = title || (typeof header === 'string' ? header : (header as any)?.props?.children ?? 'Dashboard');
  const title = String(resolvedTitle);`
  );
  
  // Fix the title usage
  content = content.replace(
    "title={String(title)}",
    "title={title}"
  );
  
  fs.writeFileSync(p, content);
  console.log('✓ Fixed AuthenticatedLayout to accept title prop');
}

// Fix Dashboard.tsx - simplify to just use AuthenticatedLayout directly
function fixDashboard() {
  const p = path.join(base, 'Pages', 'Dashboard.tsx');
  let content = fs.readFileSync(p, 'utf8');
  
  // Remove all the role-based if/else and replace with a single return
  const roleChainStart = content.indexOf('if (roles.includes(\'super_admin\'))');
  const lastReturn = content.lastIndexOf('return (');
  const endOfFile = content.lastIndexOf(')');
  
  if (roleChainStart > 0 && lastReturn > roleChainStart) {
    const before = content.substring(0, roleChainStart);
    const after = content.substring(lastReturn);
    
    // Put it all together with a simple AuthenticatedLayout call
    content = before + `
  return (
    <AuthenticatedLayout user={user} title="Dashboard">
      {content}
    </AuthenticatedLayout>
  );
`;
  }
  
  fs.writeFileSync(p, content);
  console.log('✓ Fixed Dashboard.tsx simplified');
}

// Fix RequisitionsLayout.tsx - convert title->header and remove unused imports
function fixRequisitionsLayout() {
  const p = path.join(base, 'Layouts', 'RequisitionsLayout.tsx');
  let content = fs.readFileSync(p, 'utf8');
  
  // The title prop is now accepted by AuthenticatedLayout, so replace title with header where needed
  // Actually just keep as is since we fixed AuthenticatedLayout to accept title
  // But remove the unused isAdmin/isFinance/isAssets/isOperations checks
  // and replace with simple AuthenticatedLayout
  
  fs.writeFileSync(p, content);
  console.log('✓ RequisitionsLayout.tsx kept as-is (AuthenticatedLayout now accepts title)');
}

// Fix resolveDocumentLayout.tsx - remove old layout references
function fixResolveDocumentLayout() {
  const p = path.join(base, 'Pages', 'Documents', 'resolveDocumentLayout.tsx');
  let content = fs.readFileSync(p, 'utf8');
  
  // Remove all old layout imports  
  content = content.replace(/import [^;]+ from '@\/Layouts\/[^;]+;\n?/g, '');
  
  // Add AuthenticatedLayout import
  if (!content.includes("import AuthenticatedLayout")) {
    content = content.replace(/import React/, "import React from 'react';\nimport AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';");
  }
  
  // Simplify the function
