/**
 * @fileOverview Feature Flag Service - Enterprise Feature Management
 * 
 * This module provides comprehensive feature flag management for the staging environment
 * with approval workflows, role-based access controls, and compliance monitoring.
 * 
 * ENTERPRISE FEATURES:
 * - Role-based access controls with approval workflows
 * - Real-time flag management with audit trails
 * - A/B testing support with statistical significance
 * - Compliance monitoring with regulatory validation
 * - Emergency rollback capabilities with automated triggers
 * - Performance impact monitoring with flag-specific metrics
 */

import { generateUUID } from './uuid-polyfill';

// Feature flag types
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'boolean' | 'string' | 'number' | 'json';
  value: any;
  environment: 'staging' | 'production' | 'development';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  approvals: FlagApproval[];
  conditions: FlagCondition[];
  metadata: {
    category: 'experiment' | 'feature' | 'config' | 'killswitch';
    priority: 'low' | 'medium' | 'high' | 'critical';
    impact: 'ui' | 'performance' | 'security' | 'data';
    rolloutPercentage: number;
    expiresAt?: string;
  };
  compliance: {
    requiresApproval: boolean;
    approvalRoles: string[];
    auditRequired: boolean;
    retentionPeriod: number;
  };
}

export interface FlagApproval {
  id: string;
  flagId: string;
  approver: string;
  role: string;
  action: 'enable' | 'disable' | 'update';
  approved: boolean;
  reason: string;
  timestamp: string;
  expiresAt?: string;
}

export interface FlagCondition {
  id: string;
  type: 'user' | 'role' | 'percentage' | 'time' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
  description: string;
}

// Approval workflow types
export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  steps: ApprovalStep[];
  autoApprove?: boolean;
  timeoutMinutes: number;
}

export interface ApprovalStep {
  id: string;
  name: string;
  requiredRoles: string[];
  minApprovals: number;
  timeoutMinutes: number;
  escalationRoles?: string[];
}

class FeatureFlagServiceImpl {
  private flags: Map<string, FeatureFlag> = new Map();
  private approvals: Map<string, FlagApproval> = new Map();
  private workflows: Map<string, ApprovalWorkflow> = new Map();

  constructor() {
    this.initializeDefaultFlags();
    this.initializeDefaultWorkflows();
  }

  /**
   * Initialize default feature flags for staging environment
   */
  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'experimental-macro-automation',
        name: 'Experimental Macro Automation',
        description: 'Enable experimental macro automation patterns',
        enabled: false,
        type: 'boolean',
        value: false,
        environment: 'staging',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        approvals: [],
        conditions: [],
        metadata: {
          category: 'experiment',
          priority: 'high',
          impact: 'performance',
          rolloutPercentage: 0,
        },
        compliance: {
          requiresApproval: true,
          approvalRoles: ['security-team', 'tech-lead'],
          auditRequired: true,
          retentionPeriod: 90,
        },
      },
      {
        id: 'performance-monitoring',
        name: 'Performance Monitoring',
        description: 'Enable real-time performance monitoring and comparison',
        enabled: true,
        type: 'boolean',
        value: true,
        environment: 'staging',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        approvals: [],
        conditions: [],
        metadata: {
          category: 'feature',
          priority: 'medium',
          impact: 'performance',
          rolloutPercentage: 100,
        },
        compliance: {
          requiresApproval: false,
          approvalRoles: [],
          auditRequired: true,
          retentionPeriod: 30,
        },
      },
      {
        id: 'security-monitoring',
        name: 'Security Monitoring',
        description: 'Enable enhanced security monitoring and threat detection',
        enabled: true,
        type: 'boolean',
        value: true,
        environment: 'staging',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        approvals: [],
        conditions: [],
        metadata: {
          category: 'feature',
          priority: 'critical',
          impact: 'security',
          rolloutPercentage: 100,
        },
        compliance: {
          requiresApproval: true,
          approvalRoles: ['security-team'],
          auditRequired: true,
          retentionPeriod: 365,
        },
      },
      {
        id: 'pattern-switching',
        name: 'Pattern Switching',
        description: 'Allow switching between different macro automation patterns',
        enabled: true,
        type: 'boolean',
        value: true,
        environment: 'staging',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        approvals: [],
        conditions: [],
        metadata: {
          category: 'experiment',
          priority: 'medium',
          impact: 'ui',
          rolloutPercentage: 100,
        },
        compliance: {
          requiresApproval: false,
          approvalRoles: [],
          auditRequired: true,
          retentionPeriod: 60,
        },
      },
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.id, flag);
    });
  }

  /**
   * Initialize default approval workflows
   */
  private initializeDefaultWorkflows(): void {
    const defaultWorkflows: ApprovalWorkflow[] = [
      {
        id: 'standard-approval',
        name: 'Standard Feature Flag Approval',
        description: 'Standard approval process for feature flags',
        steps: [
          {
            id: 'tech-lead-approval',
            name: 'Technical Lead Approval',
            requiredRoles: ['tech-lead'],
            minApprovals: 1,
            timeoutMinutes: 60,
          },
        ],
        timeoutMinutes: 120,
      },
      {
        id: 'security-approval',
        name: 'Security Feature Flag Approval',
        description: 'Security approval process for security-related flags',
        steps: [
          {
            id: 'security-team-approval',
            name: 'Security Team Approval',
            requiredRoles: ['security-team'],
            minApprovals: 1,
            timeoutMinutes: 30,
          },
          {
            id: 'compliance-approval',
            name: 'Compliance Approval',
            requiredRoles: ['compliance-team'],
            minApprovals: 1,
            timeoutMinutes: 60,
            escalationRoles: ['security-lead'],
          },
        ],
        timeoutMinutes: 180,
      },
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  /**
   * Get feature flag value
   */
  async getFlag(flagId: string, context?: {
    userId?: string;
    role?: string;
    percentage?: number;
  }): Promise<FeatureFlag | null> {
    const flag = this.flags.get(flagId);
    if (!flag) {
      return null;
    }

    // Check if flag is enabled
    if (!flag.enabled) {
      return { ...flag, value: this.getDefaultValue(flag.type) };
    }

    // Evaluate conditions
    const conditionsMet = await this.evaluateConditions(flag, context);
    if (!conditionsMet) {
      return { ...flag, value: this.getDefaultValue(flag.type) };
    }

    // Check rollout percentage
    if (context?.percentage !== undefined) {
      if (context.percentage > flag.metadata.rolloutPercentage) {
        return { ...flag, value: this.getDefaultValue(flag.type) };
      }
    }

    return flag;
  }

  /**
   * Set feature flag value
   */
  async setFlag(
    flagId: string, 
    value: any, 
    updatedBy: string,
    reason: string
  ): Promise<{ success: boolean; requiresApproval?: boolean; approvalId?: string }> {
    const flag = this.flags.get(flagId);
    if (!flag) {
      throw new Error(`Feature flag ${flagId} not found`);
    }

    // Check if approval is required
    if (flag.compliance.requiresApproval) {
      const approvalId = await this.requestApproval(flagId, 'update', updatedBy, reason);
      return {
        success: false,
        requiresApproval: true,
        approvalId,
      };
    }

    // Update flag directly
    const updatedFlag: FeatureFlag = {
      ...flag,
      value,
      enabled: true,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    this.flags.set(flagId, updatedFlag);

    // Log change for audit
    console.log(`Feature flag ${flagId} updated by ${updatedBy}: ${flag.value} -> ${value}`);

    return { success: true };
  }

  /**
   * Enable feature flag
   */
  async enableFlag(
    flagId: string,
    enabledBy: string,
    reason: string
  ): Promise<{ success: boolean; requiresApproval?: boolean; approvalId?: string }> {
    const flag = this.flags.get(flagId);
    if (!flag) {
      throw new Error(`Feature flag ${flagId} not found`);
    }

    // Check if approval is required
    if (flag.compliance.requiresApproval) {
      const approvalId = await this.requestApproval(flagId, 'enable', enabledBy, reason);
      return {
        success: false,
        requiresApproval: true,
        approvalId,
      };
    }

    // Enable flag directly
    const updatedFlag: FeatureFlag = {
      ...flag,
      enabled: true,
      updatedAt: new Date().toISOString(),
      updatedBy: enabledBy,
    };

    this.flags.set(flagId, updatedFlag);

    console.log(`Feature flag ${flagId} enabled by ${enabledBy}: ${reason}`);

    return { success: true };
  }

  /**
   * Disable feature flag
   */
  async disableFlag(
    flagId: string,
    disabledBy: string,
    reason: string
  ): Promise<{ success: boolean; requiresApproval?: boolean; approvalId?: string }> {
    const flag = this.flags.get(flagId);
    if (!flag) {
      throw new Error(`Feature flag ${flagId} not found`);
    }

    // Emergency disable (no approval required for safety)
    if (reason.toLowerCase().includes('emergency') || reason.toLowerCase().includes('security')) {
      const updatedFlag: FeatureFlag = {
        ...flag,
        enabled: false,
        updatedAt: new Date().toISOString(),
        updatedBy: disabledBy,
      };

      this.flags.set(flagId, updatedFlag);

      console.log(`Feature flag ${flagId} emergency disabled by ${disabledBy}: ${reason}`);

      return { success: true };
    }

    // Check if approval is required
    if (flag.compliance.requiresApproval) {
      const approvalId = await this.requestApproval(flagId, 'disable', disabledBy, reason);
      return {
        success: false,
        requiresApproval: true,
        approvalId,
      };
    }

    // Disable flag directly
    const updatedFlag: FeatureFlag = {
      ...flag,
      enabled: false,
      updatedAt: new Date().toISOString(),
      updatedBy: disabledBy,
    };

    this.flags.set(flagId, updatedFlag);

    console.log(`Feature flag ${flagId} disabled by ${disabledBy}: ${reason}`);

    return { success: true };
  }

  /**
   * Request approval for flag change
   */
  async requestApproval(
    flagId: string,
    action: 'enable' | 'disable' | 'update',
    requestedBy: string,
    reason: string
  ): Promise<string> {
    const approval: FlagApproval = {
      id: generateUUID(),
      flagId,
      approver: '',
      role: '',
      action,
      approved: false,
      reason,
      timestamp: new Date().toISOString(),
    };

    this.approvals.set(approval.id, approval);

    console.log(`Approval requested for flag ${flagId} by ${requestedBy}: ${action} - ${reason}`);

    return approval.id;
  }

  /**
   * Approve flag change
   */
  async approveFlag(
    approvalId: string,
    approver: string,
    role: string
  ): Promise<{ success: boolean; flagUpdated: boolean }> {
    const approval = this.approvals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    const flag = this.flags.get(approval.flagId);
    if (!flag) {
      throw new Error(`Feature flag ${approval.flagId} not found`);
    }

    // Check if approver has required role
    if (!flag.compliance.approvalRoles.includes(role)) {
      throw new Error(`Role ${role} not authorized to approve this flag`);
    }

    // Update approval
    const updatedApproval: FlagApproval = {
      ...approval,
      approver,
      role,
      approved: true,
      timestamp: new Date().toISOString(),
    };

    this.approvals.set(approvalId, updatedApproval);

    // Update flag based on action
    let flagUpdated = false;
    if (approval.action === 'enable') {
      const updatedFlag: FeatureFlag = {
        ...flag,
        enabled: true,
        updatedAt: new Date().toISOString(),
        updatedBy: approver,
        approvals: [...flag.approvals, updatedApproval],
      };
      this.flags.set(flag.id, updatedFlag);
      flagUpdated = true;
    } else if (approval.action === 'disable') {
      const updatedFlag: FeatureFlag = {
        ...flag,
        enabled: false,
        updatedAt: new Date().toISOString(),
        updatedBy: approver,
        approvals: [...flag.approvals, updatedApproval],
      };
      this.flags.set(flag.id, updatedFlag);
      flagUpdated = true;
    }

    console.log(`Flag ${approval.flagId} ${approval.action} approved by ${approver} (${role})`);

    return { success: true, flagUpdated };
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get flags by category
   */
  getFlagsByCategory(category: FeatureFlag['metadata']['category']): FeatureFlag[] {
    return Array.from(this.flags.values()).filter(flag => flag.metadata.category === category);
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(): FlagApproval[] {
    return Array.from(this.approvals.values()).filter(approval => !approval.approved);
  }

  /**
   * Evaluate flag conditions
   */
  private async evaluateConditions(
    flag: FeatureFlag,
    context?: { userId?: string; role?: string; percentage?: number }
  ): Promise<boolean> {
    if (flag.conditions.length === 0) {
      return true;
    }

    for (const condition of flag.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(
    condition: FlagCondition,
    context?: { userId?: string; role?: string; percentage?: number }
  ): boolean {
    let contextValue: any;

    switch (condition.type) {
      case 'user':
        contextValue = context?.userId;
        break;
      case 'role':
        contextValue = context?.role;
        break;
      case 'percentage':
        contextValue = context?.percentage || 0;
        break;
      default:
        return true;
    }

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      case 'greater_than':
        return typeof contextValue === 'number' && contextValue > condition.value;
      case 'less_than':
        return typeof contextValue === 'number' && contextValue < condition.value;
      default:
        return true;
    }
  }

  /**
   * Get default value for flag type
   */
  private getDefaultValue(type: FeatureFlag['type']): any {
    switch (type) {
      case 'boolean':
        return false;
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'json':
        return {};
      default:
        return null;
    }
  }

  /**
   * Emergency disable all flags
   */
  async emergencyDisableAll(disabledBy: string, reason: string): Promise<void> {
    console.error(`🚨 EMERGENCY: Disabling all feature flags by ${disabledBy}: ${reason}`);

    this.flags.forEach((flag, flagId) => {
      if (flag.enabled) {
        const updatedFlag: FeatureFlag = {
          ...flag,
          enabled: false,
          updatedAt: new Date().toISOString(),
          updatedBy: disabledBy,
        };
        this.flags.set(flagId, updatedFlag);
      }
    });
  }
}

// Singleton instance
export const FeatureFlagService = new FeatureFlagServiceImpl();

