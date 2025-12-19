"""
Background tasks for ComputeHub
"""

from app.tasks.sync_deployments import sync_deployment_status, mark_stale_deployments

__all__ = ["sync_deployment_status", "mark_stale_deployments"]
