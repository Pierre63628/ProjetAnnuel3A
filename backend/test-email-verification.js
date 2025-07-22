/**
 * Test script for email verification system
 * Run with: node test-email-verification.js
 */

import { EmailVerificationModel } from './src/models/email-verification.model.js';
import VerificationService from './src/services/verification.service.js';
import emailService from './src/services/email.service.js';
import { UserModel } from './src/models/user.model.js';

async function testEmailVerificationSystem() {
    console.log('🧪 Testing Email Verification System...\n');

    try {
        // Test 1: Email service configuration
        console.log('1. Testing email service configuration...');
        const emailConfigValid = await emailService.testConnection();
        console.log(`   Email config: ${emailConfigValid ? '✅ Valid' : '❌ Invalid'}\n`);

        // Test 2: Verification code generation
        console.log('2. Testing verification code generation...');
        const code1 = EmailVerificationModel.generateVerificationCode();
        const code2 = EmailVerificationModel.generateVerificationCode();
        console.log(`   Generated codes: ${code1}, ${code2}`);
        console.log(`   Code format valid: ${/^\d{6}$/.test(code1) ? '✅' : '❌'}`);
        console.log(`   Codes are unique: ${code1 !== code2 ? '✅' : '❌'}\n`);

        // Test 3: Expiration time calculation
        console.log('3. Testing expiration time calculation...');
        const expirationTime = EmailVerificationModel.calculateExpirationTime();
        const now = new Date();
        const timeDiff = (expirationTime.getTime() - now.getTime()) / (1000 * 60); // minutes
        console.log(`   Expiration time: ${expirationTime.toISOString()}`);
        console.log(`   Time until expiry: ${timeDiff.toFixed(1)} minutes`);
        console.log(`   Expiry time valid: ${timeDiff >= 14 && timeDiff <= 16 ? '✅' : '❌'}\n`);

        // Test 4: Test user lookup (if users exist)
        console.log('4. Testing user lookup...');
        try {
            const testUser = await UserModel.findByEmail('test@example.com');
            if (testUser) {
                console.log(`   Test user found: ${testUser.email} (ID: ${testUser.id})`);
                
                // Test verification status
                const isVerified = await VerificationService.isEmailVerified(testUser.id);
                console.log(`   Email verified: ${isVerified ? '✅' : '❌'}`);
                
                // Test verification status details
                const status = await VerificationService.getVerificationStatus(testUser.id);
                console.log(`   Verification status:`, status);
            } else {
                console.log('   No test user found (this is normal for fresh installations)');
            }
        } catch (error) {
            console.log(`   User lookup test skipped: ${error.message}`);
        }
        console.log();

        // Test 5: Database schema validation
        console.log('5. Testing database schema...');
        try {
            // Test if EmailVerification table exists and has correct structure
            const { default: pool } = await import('./src/config/db.js');
            
            const tableExists = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'EmailVerification'
                );
            `);
            console.log(`   EmailVerification table exists: ${tableExists.rows[0].exists ? '✅' : '❌'}`);

            if (tableExists.rows[0].exists) {
                const columns = await pool.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'EmailVerification'
                    ORDER BY ordinal_position;
                `);
                console.log('   Table columns:');
                columns.rows.forEach(col => {
                    console.log(`     - ${col.column_name}: ${col.data_type}`);
                });
            }

            // Test if User table has email verification columns
            const userColumns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'Utilisateur' 
                AND column_name IN ('email_verified', 'email_verified_at')
                ORDER BY column_name;
            `);
            console.log(`   User table has verification columns: ${userColumns.rows.length === 2 ? '✅' : '❌'}`);
            userColumns.rows.forEach(col => {
                console.log(`     - ${col.column_name}: ${col.data_type}`);
            });

        } catch (error) {
            console.log(`   Database schema test failed: ${error.message}`);
        }
        console.log();

        // Test 6: Environment variables
        console.log('6. Testing environment variables...');
        const requiredEnvVars = [
            'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'FROM_EMAIL', 'FROM_NAME'
        ];
        const optionalEnvVars = [
            'SMTP_PASS', 'VERIFICATION_CODE_EXPIRY', 'MAX_VERIFICATION_ATTEMPTS', 'MAX_RESEND_ATTEMPTS'
        ];

        console.log('   Required variables:');
        requiredEnvVars.forEach(varName => {
            const value = process.env[varName];
            console.log(`     ${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
        });

        console.log('   Optional variables:');
        optionalEnvVars.forEach(varName => {
            const value = process.env[varName];
            console.log(`     ${varName}: ${value ? `✅ ${value}` : '⚠️ Using default'}`);
        });
        console.log();

        // Test 7: API endpoints (basic structure test)
        console.log('7. Testing API endpoint structure...');
        try {
            const { default: authController } = await import('./src/controllers/auth.controller.js');
            console.log(`   verifyEmail function: ${typeof authController.verifyEmail === 'function' ? '✅' : '❌'}`);
            console.log(`   resendVerificationEmail function: ${typeof authController.resendVerificationEmail === 'function' ? '✅' : '❌'}`);
            console.log(`   getVerificationStatus function: ${typeof authController.getVerificationStatus === 'function' ? '✅' : '❌'}`);
        } catch (error) {
            console.log(`   API endpoint test failed: ${error.message}`);
        }

        console.log('\n🎉 Email verification system test completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Configure SMTP settings in environment variables');
        console.log('2. Test with a real email address');
        console.log('3. Run `sudo docker compose build` to rebuild containers');
        console.log('4. Register a new user to test the full flow');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
testEmailVerificationSystem().catch(console.error);
