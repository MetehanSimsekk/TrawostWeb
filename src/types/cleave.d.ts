declare module 'cleave.js/react' {
  import * as React from 'react';

  interface CleaveOptions {
    phone?: boolean;
    phoneRegionCode?: string;
    delimiters?: string[];
    blocks?: number[];
    numericOnly?: boolean;
    prefix?: string;
    creditCard?: boolean;
    date?: boolean;
    time?: boolean;
  }

  interface CleaveProps extends React.InputHTMLAttributes<HTMLInputElement> {
    options: CleaveOptions;
    onChange?: (event: any) => void;
    onInit?: (cleave: any) => void;
  }

  const Cleave: React.FC<CleaveProps>;

  export default Cleave;
}