import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    'global',
    'ts',
    `
// 全局共享数据示例
import { DEFAULT_NAME } from '@/constants';
import { useState } from 'react';

const useUser = () => {
    const [name, setName] = useState<string>(DEFAULT_NAME);
    return {
    name,
    setName,
    };
};

export default useUser;
  `,
  );
  return [['src', 'models'], file];
}
