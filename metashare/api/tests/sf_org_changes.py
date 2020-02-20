from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest

from ..sf_org_changes import (
    commit_changes_to_github,
    compare_revisions,
    get_latest_revision_numbers,
    run_retrieve_task,
)

PATCH_ROOT = "metashare.api.sf_org_changes"


@pytest.mark.django_db
def test_run_retrieve_task(user_factory, scratch_org_factory):
    user = user_factory()
    scratch_org = scratch_org_factory()
    with ExitStack() as stack:
        stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))
        stack.enter_context(patch(f"{PATCH_ROOT}.BaseCumulusCI"))
        stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        retrieve_components = stack.enter_context(
            patch(f"{PATCH_ROOT}.retrieve_components")
        )

        desired_changes = {"name": ["member"]}
        run_retrieve_task(user, scratch_org, ".", desired_changes, "src")

        assert retrieve_components.called


@pytest.mark.django_db
def test_commit_changes_to_github(user_factory, scratch_org_factory):
    user = user_factory()
    scratch_org = scratch_org_factory()
    with ExitStack() as stack:
        local_github_checkout = stack.enter_context(
            patch(f"{PATCH_ROOT}.local_github_checkout")
        )
        local_github_checkout.return_value = MagicMock(
            __enter__=MagicMock(return_value=".")
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.run_retrieve_task"))
        stack.enter_context(patch(f"{PATCH_ROOT}.get_repo_info"))
        CommitDir = stack.enter_context(patch(f"{PATCH_ROOT}.CommitDir"))

        desired_changes = {"name": ["member"]}
        commit_changes_to_github(
            user=user,
            scratch_org=scratch_org,
            repo_id=123,
            branch="test-branch",
            desired_changes=desired_changes,
            commit_message="test message",
            target_directory="src",
        )

        assert CommitDir.called


def test_get_latest_revision_numbers():
    with ExitStack() as stack:
        Salesforce = stack.enter_context(
            patch(f"{PATCH_ROOT}.simple_salesforce.Salesforce")
        )
        stack.enter_context(patch(f"{PATCH_ROOT}.refresh_access_token"))

        conn = MagicMock()
        conn.query_all.return_value = {
            "records": [
                {
                    "MemberType": "some-type-1",
                    "MemberName": "some-name-1",
                    "RevisionCounter": 3,
                },
                {
                    "MemberType": "some-type-1",
                    "MemberName": "some-name-2",
                    "RevisionCounter": 3,
                },
                {
                    "MemberType": "some-type-2",
                    "MemberName": "some-name-1",
                    "RevisionCounter": 3,
                },
                {
                    "MemberType": "some-type-2",
                    "MemberName": "some-name-2",
                    "RevisionCounter": 3,
                },
            ]
        }
        Salesforce.return_value = conn

        scratch_org = MagicMock()

        get_latest_revision_numbers(scratch_org=scratch_org)

        assert conn.query_all.called


def test_compare_revisions__true():
    old = {}
    new = {"type": {"name": 1}}
    assert compare_revisions(old, new)


def test_compare_revisions__false():
    old = {"type": {"name": 1}}
    new = {"type": {"name": 1}}
    assert not compare_revisions(old, new)
