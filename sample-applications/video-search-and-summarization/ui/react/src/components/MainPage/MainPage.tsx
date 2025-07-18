import { useState, type FC } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import Notice from '../Notice/Notice.tsx';
import Navbar from '../Navbar/Navbar.tsx';
import { FEATURE_MUX, FEATURE_SEARCH, FEATURE_SUMMARY } from '../../config.ts';
import { FEATURE_STATE, FeatureMux } from '../../utils/constant.ts';
import { SplashAtomic, SplashAtomicSearch, SplashAtomicSummary } from './SplashAtomic.tsx';

const StyledGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 15rem auto;
  grid-template-rows: 1fr;
  flex: 1 1 auto;
  overflow: hidden;
  @media (min-width: 1700px) {
    grid-template-columns: 20rem auto;
  }
  @media (min-width: 2000px) {
    grid-template-columns: 25rem auto;
  }
  @media (min-width: 2300px) {
    grid-template-columns: 30rem auto;
  }
  // padding-inline: 0;
  // max-inline-size: 100%;
`;

const StyledMain = styled.main`
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: flex-start;
`;

const HiddenButton = styled.button`
  display: none;
`;

const MainPage: FC = () => {
  const { t } = useTranslation();
  const message = <div>{t('noticeMessage')}</div>;
  const [isNoticeVisible, setIsNoticeVisible] = useState<boolean>(false);

  const getSplash = () => {
    if (FEATURE_MUX == FeatureMux.ATOMIC) {
      if (FEATURE_SEARCH == FEATURE_STATE.ON && FEATURE_SUMMARY == FEATURE_STATE.ON) {
        return <SplashAtomic />;
      } else if (FEATURE_SEARCH == FEATURE_STATE.ON) {
        return <SplashAtomicSearch />;
      } else {
        return <SplashAtomicSummary />;
      }
    } else {
      return <SplashAtomicSummary />;
    }
  };

  return (
    <StyledMain>
      <Navbar />
      <HiddenButton data-testid='toggle-notice' onClick={() => setIsNoticeVisible(true)}>
        t('showNoticeHiddenButton')
      </HiddenButton>

      <Notice message={message} isNoticeVisible={isNoticeVisible} setIsNoticeVisible={setIsNoticeVisible} />
      <StyledGrid>
        {getSplash()}

        {/* <SummarySidebar />
        <Summary /> */}
      </StyledGrid>
    </StyledMain>
  );
};

export default MainPage;
