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

const { unarchiveRepository } =
  await import('../../action/repository/unarchive-repository.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

const issueOpsInputs = {
  organization: 'issue-ops',
  repository: 'self-service',
  issueNumber: 1
}

describe('unarchiveRepository', () => {
  beforeEach(() => {
    github.context.repo.owner = 'issue-ops'

    mocktokit.rest.repos.get.mockResolvedValue({
      data: {
        archived: true
      }
    } as any)

    core.getInput.mockReturnValue(
      JSON.stringify({
        unarchive_repository_organization: 'issue-ops',
        unarchive_repository_name: 'self-service'
      })
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Unarchives a repository (demo mode)', async () => {
    await unarchiveRepository(issueOpsInputs)

    expect(mocktokit.rest.repos.update).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Unarchives a repository (live mode)', async () => {
    github.context.repo.owner = 'not-issue-ops'

    await unarchiveRepository(issueOpsInputs)

    expect(mocktokit.rest.repos.update).toHaveBeenCalledWith({
      owner: 'issue-ops',
      repo: 'self-service',
      archived: false
    })
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Does nothing if repository is already unarchived (live mode)', async () => {
    mocktokit.rest.repos.get.mockResolvedValue({
      data: {
        archived: false
      }
    } as any)

    github.context.repo.owner = 'not-issue-ops'

    await unarchiveRepository(issueOpsInputs)

    expect(mocktokit.rest.repos.update).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })
})
