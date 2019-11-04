import React, { Fragment } from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'

import Link from './Link'
import { LINKS_PER_PAGE } from '../constants'

export const FEED_QUERY = gql`
  query FeedQuery($first: Int, $skip: Int, $orderBy: LinkOrderByInput) {
    feed(first: $first, skip: $skip, orderBy: $orderBy) {
      links {
        id
        createdAt
        url
        description
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      count
    }
  }
`

const NEW_LINKS_SUBSCRIPTION = gql`
  subscription {
    newLink {
      id
      url
      description
      createdAt
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
  }
`

const NEW_VOTES_SUBSCRIPTION = gql`
  subscription {
    newVote {
      id
      link {
        id
        url
        description
        createdAt
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      user {
        id
      }
    }
  }
`

const LinkList = ({
  match: {
    params: { page },
  },
  location: { pathname },
  history,
}) => {
  const _subscribeToNewLinks = subscribeToMore => {
    subscribeToMore({
      document: NEW_LINKS_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev
        const newLink = subscriptionData.data.newLink
        const exists = prev.feed.links.find(({ id }) => id === newLink.id)
        if (exists) return prev

        return Object.assign({}, prev, {
          feed: {
            links: [newLink, ...prev.feed.links],
            count: prev.feed.links.length + 1,
            __typename: prev.feed.__typename,
          },
        })
      },
    })
  }

  const _subscribeToNewVotes = subscribeToMore => {
    subscribeToMore({
      document: NEW_VOTES_SUBSCRIPTION,
    })
  }

  const _getQueryVariables = () => {
    const isNewPage = pathname.includes('new')
    const pageParam = parseInt(page, 10)

    const skip = isNewPage ? (pageParam - 1) * LINKS_PER_PAGE : 0
    const first = isNewPage ? LINKS_PER_PAGE : 100
    const orderBy = isNewPage ? 'createdAt_DESC' : null
    return { first, skip, orderBy }
  }

  const _getLinksToRender = data => {
    const isNewPage = pathname.includes('new')
    if (isNewPage) {
      return data.feed.links
    }
    const rankedLinks = data.feed.links.slice()
    rankedLinks.sort((l1, l2) => l2.votes.length - l1.votes.length)
    return rankedLinks
  }

  const _nextPage = data => {
    const pageParam = parseInt(page, 10)
    if (pageParam <= data.feed.count / LINKS_PER_PAGE) {
      const nextPage = pageParam + 1
      history.push(`/new/${nextPage}`)
    }
  }

  const _previousPage = () => {
    const pageParam = parseInt(page, 10)
    if (pageParam > 1) {
      const previousPage = pageParam - 1
      history.push(`/new/${previousPage}`)
    }
  }

  return (
    <Query query={FEED_QUERY} variables={_getQueryVariables()}>
      {({ loading, error, data, subscribeToMore }) => {
        if (loading) return <div>Fetching</div>
        if (error) return <div>Error</div>

        _subscribeToNewLinks(subscribeToMore)
        _subscribeToNewVotes(subscribeToMore)

        const linksToRender = _getLinksToRender(data)
        const isNewPage = pathname.includes('new')
        const pageIndex = page ? (page - 1) * LINKS_PER_PAGE : 0

        return (
          <Fragment>
            {linksToRender.map((link, index) => (
              <Link key={link.id} link={link} index={index + pageIndex} />
            ))}
            {isNewPage && (
              <div className="flex ml4 mv3 gray">
                <div className="pointer mr2" onClick={_previousPage}>
                  Previous
                </div>
                <div className="pointer" onClick={() => _nextPage(data)}>
                  Next
                </div>
              </div>
            )}
          </Fragment>
        )
      }}
    </Query>
  )
}

export default LinkList
