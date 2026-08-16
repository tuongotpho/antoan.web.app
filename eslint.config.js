import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      // KHÔNG bỏ qua 'functions/**' nữa.
      //
      // Trước đây cả thư mục functions bị loại khỏi lint, tức phần máy chủ —
      // nơi gửi thông báo, gửi email và gọi API tính tiền — lại là chỗ DUY NHẤT
      // không được soát. Hậu quả có thật: một biến bị xoá mà còn sót chỗ dùng
      // lọt qua mọi vòng kiểm, chỉ lộ ra khi hàm sập giữa lúc chạy thật và
      // thông báo yêu cầu mới im lặng biến mất. Rule no-undef bắt được ngay
      // nếu eslint được phép nhìn vào file đó.
      'functions/node_modules/**',
      'public/sw.js',
      'tailwind.config.js',
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // React-specific config
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    rules: {
      // React hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // TypeScript - relaxed for existing codebase
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',

      // General - relaxed
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
    },
  },

  // Node.js scripts
  {
    files: ['scripts/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Cloud Functions — mã chạy trên máy chủ, viết theo kiểu CommonJS.
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Đây là chốt chặn chính: bắt biến chưa khai báo. Chính rule này lẽ ra
      // đã chặn được lỗi "TELEGRAM_CHAT_ID is not defined" trước khi deploy.
      'no-undef': 'error',

      // Máy chủ ghi log là chuyện bình thường
      'no-console': 'off',

      // Đây là JavaScript thuần theo kiểu CommonJS, không phải TypeScript.
      // Các rule dưới đây sinh ra để giữ nếp cho mã TypeScript, áp vào đây chỉ
      // tạo tiếng ồn và che mất lỗi thật.
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // Files that use process.env
  {
    files: ['services/firebaseConfig.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },

  // Prettier must be last to override conflicting rules
  eslintConfigPrettier
);
