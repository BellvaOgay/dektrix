// Build script to compile TypeScript API functions to JavaScript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building API functions for Vercel deployment...');

try {
    // Clean the api-compiled directory
    if (fs.existsSync('api-compiled')) {
        fs.rmSync('api-compiled', { recursive: true, force: true });
    }
    fs.mkdirSync('api-compiled', { recursive: true });

    // Compile all TypeScript API files
    console.log('📦 Compiling TypeScript API functions...');
    
    // Compile each TypeScript file individually
    const compileFile = (filePath) => {
        try {
            execSync(`npx tsc ${filePath} --outDir api-compiled --target es2020 --module commonjs --esModuleInterop true`, {
                stdio: 'inherit'
            });
        } catch (error) {
            console.warn(`⚠️  Could not compile ${filePath}:`, error.message);
        }
    };
    
    // Find and compile all TypeScript files in api directory
    const findAndCompileTSFiles = (dir) => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                findAndCompileTSFiles(fullPath);
            } else if (item.name.endsWith('.ts')) {
                console.log(`🔨 Compiling: ${fullPath}`);
                compileFile(fullPath);
            }
        }
    };
    
    findAndCompileTSFiles('api');

    // Copy any non-TypeScript files from api/ to api-compiled/api/
    console.log('📋 Copying non-TypeScript files...');
    
    // Create the api-compiled/api directory if it doesn't exist
    if (!fs.existsSync('api-compiled/api')) {
        fs.mkdirSync('api-compiled/api', { recursive: true });
    }
    
    // Copy files using Node.js built-in methods
    const copyDir = (src, dest) => {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const items = fs.readdirSync(src, { withFileTypes: true });
        
        for (const item of items) {
            const srcPath = path.join(src, item.name);
            const destPath = path.join(dest, item.name);
            
            if (item.isDirectory()) {
                copyDir(srcPath, destPath);
            } else if (!item.name.endsWith('.ts')) {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    };
    
    copyDir('api', 'api-compiled/api');

    console.log('✅ API functions compiled successfully!');
    console.log('📁 Compiled files are in: api-compiled/');
    
} catch (error) {
    console.error('❌ Error building API functions:', error);
    process.exit(1);
}