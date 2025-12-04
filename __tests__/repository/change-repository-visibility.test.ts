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

const { changeRepositoryVisibility } =
  await import('../../action/repository/change-repository-visibility.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

const issueOpsInputs = {
  organization: 'issue-ops',
  repository: 'self-service',
  issueNumber: 1
}

describe('changeRepositoryVisibility', () => {
  beforeEach(() => {
    github.context.repo.owner = 'issue-ops'

    mocktokit.rest.repos.get.mockResolvedValue({
      data: {
        visibility: 'public'
      }
    } as any)

    core.getInput.mockReturnValue(
      JSON.stringify({
        change_repository_visibility_organization: 'issue-ops',
        change_repository_visibility_name: 'self-service',
        change_repository_visibility_visibility: 'private'
      })
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Changes the visibility (demo mode)', async () => {
    await changeRepositoryVisibility(issueOpsInputs)

    expect(mocktokit.rest.repos.update).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Changes the visibility (live mode)', async () => {
    github.context.repo.owner = 'not-issue-ops'

    await changeRepositoryVisibility(issueOpsInputs)

    expect(mocktokit.rest.repos.update).toHaveBeenCalledWith({
      owner: 'issue-ops',
      repo: 'self-service',
      visibility: 'private'
    })
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Does nothing if repository is already the right visibility (live mode)', async () => {
    mocktokit.rest.repos.get.mockResolvedValue({
      data: {
        visibility: 'private'
      }
    } as any)

    github.context.repo.owner = 'not-issue-ops'

    await changeRepositoryVisibility(issueOpsInputs)

    expect(mocktokit.rest.repos.update).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })
})
