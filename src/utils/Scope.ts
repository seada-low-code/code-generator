import { IScope } from '../types/core';
import { IScopeBindings, ScopeBindings } from './ScopeBindings';

export class Scope implements IScope {
  /**
   * 创建根部 Scope，根据需要被上溯的作用域链决定是否开启新的
   */
  static createRootScope(): IScope {
    return new Scope();
  }
  // 当前作用域内的变量和函数等
  bindings?: IScopeBindings;

  constructor(public readonly parent: IScope | null = null) {
    this.bindings = undefined;
  }
  /**
   * 创建一个子作用域，并且初始化ownIdentifiers变量
   * @param ownIdentifiers 子作用域的变量名
   * @returns 返回一个作用域实例
   */
  createSubScope(ownIdentifiers: string[]): IScope {
    const originalScopeBindings = this.bindings;
    const newScopeBindings = new ScopeBindings(originalScopeBindings);
    ownIdentifiers.forEach((identifier) => {
      // 作用域内添加一个名为identifier的变量
      newScopeBindings.addBinding(identifier);
    });
    const newScope = new Scope(this);
    newScope.bindings = newScopeBindings;
    return newScope;
  }
}
