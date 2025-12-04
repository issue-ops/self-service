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

const { renameRepository } =
  await import('../../action/repository/rename-repository.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

const issueOpsInputs = {
  organization: 'issue-ops',
  repository: 'self-service',
  issueNumber: 1
}

describe('renameRepository', () => {
  beforeEach(() => {
    github.context.repo.owner = 'issue-ops'

    mocktokit.rest.repos.get.mockResolvedValue({
      data: {
        name: 'self-service'
      }
    } as any)

    core.getInput.mockReturnValue(
      JSON.stringify({
        rename_repository_organization: 'issue-ops',
        rename_repository_current_name: 'self-service',
        rename_repository_new_name: 'self-service-new'
      })
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Renames a repository (demo mode)', async () => {
    await renameRepository(issueOpsInputs)

    expect(mocktokit.rest.repos.update).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Renames a repository (live mode)', async () => {
    github.context.repo.owner = 'not-issue-ops'

    await renameRepository(issueOpsInputs)

    expect(mocktokit.rest.repos.update).toHaveBeenCalledWith({
      owner: 'issue-ops',
      repo: 'self-service',
      name: 'self-service-new'
    })
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Does nothing if repository is already renamed (live mode)', async () => {
    mocktokit.rest.repos.get.mockResolvedValue({
      data: {
        name: 'self-service-new'
      }
    } as any)

    github.context.repo.owner = 'not-issue-ops'

    await renameRepository(issueOpsInputs)

    expect(mocktokit.rest.repos.update).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })
})
