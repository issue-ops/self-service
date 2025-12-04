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

const { createAnnouncement } =
  await import('../../action/organization/create-announcement.js')

const { Octokit } = await import('@octokit/rest')
const mocktokit = jest.mocked(new Octokit())

const issueOpsInputs = {
  organization: 'issue-ops',
  repository: 'self-service',
  issueNumber: 1
}

describe('createAnnouncement', () => {
  beforeEach(() => {
    github.context.repo.owner = 'issue-ops'
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Creates an organization announcement (demo mode)', async () => {
    core.getInput.mockReturnValue(
      JSON.stringify({
        create_announcement_organization: 'issue-ops',
        create_announcement_expiration_date: '2024-01-01T00:00:00Z',
        create_announcement_user_dismissible: {
          selected: ['Enable'],
          unselected: []
        },
        create_announcement_markdown: 'Hello, World!'
      })
    )

    await createAnnouncement(issueOpsInputs)

    expect(mocktokit.request).not.toHaveBeenCalled()
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })

  it('Creates an organization announcement (live mode)', async () => {
    core.getInput.mockReturnValue(
      JSON.stringify({
        create_announcement_organization: 'issue-ops',
        create_announcement_expiration_date: '2024-01-01T00:00:00Z',
        create_announcement_user_dismissible: {
          selected: ['Enable'],
          unselected: []
        },
        create_announcement_markdown: 'Hello, World!'
      })
    )

    github.context.repo.owner = 'not-issue-ops'

    await createAnnouncement(issueOpsInputs)

    expect(mocktokit.request).toHaveBeenCalledWith(
      'PATCH /orgs/{org}/announcement',
      {
        org: 'issue-ops',
        announcement: 'Hello, World!',
        expires_at: expect.any(String),
        user_dismissible: true
      }
    )
    expect(issues.addComment).toHaveBeenCalled()
    expect(issues.closeIssue).toHaveBeenCalled()
  })
})
