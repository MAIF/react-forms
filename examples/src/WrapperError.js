import React from 'react'

export default class WrapperError extends React.Component {
    state = {
        error: undefined
    }

    componentDidCatch(error) {
        this.setState({ error })
    }

    reset() {
        this.setState({ error: undefined })
    }

    render() {
        if (this.state.error)
            return <div>Something wrong happened</div>
        return this.props.children
    }
}