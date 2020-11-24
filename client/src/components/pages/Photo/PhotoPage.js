import React from 'react';
import { Container } from 'reactstrap';
import { withRouter } from 'react-router-dom';
import { PropTypes } from 'prop-types';
import PhotoPreview from '../../features/PhotoPreview/PhotoPreviewContainer';

const SubmitPage = ({ match }) => (
  <Container>
    <PhotoPreview id={match.params.id} />
  </Container>
);

SubmitPage.propTypes = {
  match: PropTypes.any,
}

export default withRouter(SubmitPage);
