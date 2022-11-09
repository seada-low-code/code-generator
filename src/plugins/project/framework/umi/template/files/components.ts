import { ResultFile } from '@alilc/lowcode-types';
import { createResultFile } from '../../../../../../utils/resultHelper';

export function getComponentEntryFile(): [string[], ResultFile] {
  const file = createResultFile(
    'index',
    'ts',
    `
import Guide from './Guide';
export default Guide;
  `,
  );
  return [['src', 'components'], file];
}

export function getGuideTsxFile(): [string[], ResultFile] {
  const file = createResultFile(
    'Guide',
    'tsx',
    `
  import { Layout, Row, Typography } from 'antd';
  import React from 'react';
  import styles from './Guide.less';
  
  interface Props {
    name: string;
  }
  
  // 脚手架示例组件
  const Guide: React.FC<Props> = (props) => {
    const { name } = props;
    return (
      <Layout>
        <Row>
          <Typography.Title level={3} className={styles.title}>
            欢迎使用 <strong>{name}</strong> ！
          </Typography.Title>
        </Row>
      </Layout>
    );
  };
  
  export default Guide;
  `,
  );
  return [['src', 'components'], file];
}

export function getGuildStyleFile(): [string[], ResultFile] {
  const file = createResultFile(
    'Guide',
    'less',
    `
.title {
  margin: 0 auto;
  font-weight: 200;
}
  `,
  );
  return [['src', 'components'], file];
}
