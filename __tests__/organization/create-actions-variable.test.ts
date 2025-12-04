import { jest } from '@jest/globals'
import * as core from '../../__fixtures__/@actions/core.js'
import * as github from '../../__fixtures__/@actions/github.js'
import * as octokit from '../../__fixtures__/@octokit/rest.js'
import * as issues from '../../__fixtures__/utils/issues.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)
jest.unstable_mockModule('@octokit/rest', () => {
  class Octokit {
    constructor() {
      return octokit
    }
  }

  return {
    Octokit
  }
})

jest.unstable_mockModule('../../action/utils/issues.js', () => issues)

const { createActionsVariable } =
  await import('../../action/organization/create-actions-variable.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

const issueOpsInputs = {
  organization: 'issue-ops',
  repository: 'self-service',
  issueNumber: 1
}

describe('createActionsVariable', () => {
  beforeEach(() => {
    github.context.repo.owner = 'issue-ops'

    mocktokit.rest.repos.get.mockResolvedValue({
      data: {
        id: 123
      }
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Creates an organization variable with visibility all (demo mode)', async () => {
    core.getInput.mockReturnValue(
      JSON.stringify({
        create_actions_variable_organization: 'issue-ops',
        create_actions_variable_name: 'MY_VARIABLE',
        create_actions_variable_value: 'MY_VALUE',
        create_actions_variable_visibility: 'all',
        create_actions_variable_repository_names: ''
      })
    )

    await createActionsVariable(issueOpsInputs)

    expect(mocktokit.rest.actions.createOrgVariable).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Creates an organization variable with visibility all (live mode)', async () => {
    core.getInput.mockReturnValue(
      JSON.stringify({
        create_actions_variable_organization: 'issue-ops',
        create_actions_variable_name: 'MY_VARIABLE',
        create_actions_variable_value: 'MY_VALUE',
        create_actions_variable_visibility: 'all',
        create_actions_variable_repository_names: ''
      })
    )

    github.context.repo.owner = 'not-issue-ops'

    await createActionsVariable(issueOpsInputs)

    expect(mocktokit.rest.actions.createOrgVariable).toHaveBeenCalledWith({
      org: 'issue-ops',
      name: 'MY_VARIABLE',
      value: 'MY_VALUE',
      visibility: 'all'
    })
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Creates an organization variable with visibility selected (demo mode)', async () => {
    core.getInput.mockReturnValue(
      JSON.stringify({
        create_actions_variable_organization: 'issue-ops',
        create_actions_variable_name: 'MY_VARIABLE',
        create_actions_variable_value: 'MY_VALUE',
        create_actions_variable_visibility: 'selected',
        create_actions_variable_repository_names: 'repo1, repo2'
      })
    )

    await createActionsVariable(issueOpsInputs)

    expect(mocktokit.rest.actions.createOrgVariable).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Creates an organization variable with visibility selected (live mode)', async () => {
    core.getInput.mockReturnValue(
      JSON.stringify({
        create_actions_variable_organization: 'issue-ops',
        create_actions_variable_name: 'MY_VARIABLE',
        create_actions_variable_value: 'MY_VALUE',
        create_actions_variable_visibility: 'selected',
        create_actions_variable_repository_names: 'repo1, repo2'
      })
    )

    github.context.repo.owner = 'not-issue-ops'

    await createActionsVariable(issueOpsInputs)

    expect(mocktokit.rest.actions.createOrgVariable).toHaveBeenCalledWith({
      org: 'issue-ops',
      name: 'MY_VARIABLE',
      value: 'MY_VALUE',
      visibility: 'selected',
      selected_repository_ids: [123, 123]
    })
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Creates an organization variable with visibility private (demo mode)', async () => {
    core.getInput.mockReturnValue(
      JSON.stringify({
        create_actions_variable_organization: 'issue-ops',
        create_actions_variable_name: 'MY_VARIABLE',
        create_actions_variable_value: 'MY_VALUE',
        create_actions_variable_visibility: 'private',
        create_actions_variable_repository_names: ''
      })
    )

    await createActionsVariable(issueOpsInputs)

    expect(mocktokit.rest.actions.createOrgVariable).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Creates an organization variable with visibility private (live mode)', async () => {
    core.getInput.mockReturnValue(
      JSON.stringify({
        create_actions_variable_organization: 'issue-ops',
        create_actions_variable_name: 'MY_VARIABLE',
        create_actions_variable_value: 'MY_VALUE',
        create_actions_variable_visibility: 'private',
        create_actions_variable_repository_names: ''
      })
    )

    github.context.repo.owner = 'not-issue-ops'

    await createActionsVariable(issueOpsInputs)

    expect(mocktokit.rest.actions.createOrgVariable).toHaveBeenCalledWith({
      org: 'issue-ops',
      name: 'MY_VARIABLE',
      value: 'MY_VALUE',
      visibility: 'private'
    })
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })
})
