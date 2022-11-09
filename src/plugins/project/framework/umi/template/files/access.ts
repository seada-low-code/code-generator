import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export default function getFile(): [string[], ResultFile] {
  const file = createResultFile(
    'access',
    'ts',
    `export default (initialState: API.UserInfo) => {
    // 在这里按照初始化数据定义项目中的权限，统一管理
    // 参考文档 https://next.umijs.org/docs/max/access
    const canSeeAdmin = !!(
        initialState && initialState.name !== 'dontHaveAccess'
    );
    return {
        canSeeAdmin,
    };
};      
`,
  );
  return [['src'], file];
}
